function StateMachine(options){
    var states = {};
    var currState = null;
    var debugMode = ~~options.debug;
    var eventHandlers = new InterfaceHandlers();
    var handlerRegex = /^on([A-Z]\S*)([A-Z]\S*)$/;
    var statemachineName = options.name || "";
    
    function InterfaceHandlers(){
        var interface = {};
        
        function handleError(exception){
            if(debugMode){
                console.error("jabche (debug) "+statemachineName+": exception caught in state "+currState.getName()+": "+exception);                
            }
                      
            var errorHandler = currState.getHandler('error');
            var logic;
            if(errorHandler){
                var logic = errorHandler.getStateLogic();
                if(logic){
                    logic.call(interface, exception);
                }
                
                var failureState = errorHandler.getNextState();
                setCurrentState(failureState);
                
                if(debugMode){
                    console.error('jabche (debug): '+statemachineName+': current state is '+failureState.getName());                
                }
            }else{
                throw exception;                
            }
        }
        
        function execute(name, data){
            if(!currState){
                throw "StateMachine "+statemachineName+": current state must be set!";
            }
            
            //Let's check if any substate would like to handle the event
            var statemachine = currState.getSubstates();
            var handled = false;
            if(statemachine && statemachine.hasOwnProperty(name)){
                var eventHandler = statemachine[name];
                try{
                    handled = eventHandler(data);                
                }catch(e){
                    handleError(e);
                    return true;
                }
            }
            if(handled){
                //Event was handled by a substate
                return handled;
            }
            
            var handler = currState.getHandler(name);
            var retval = true;
            if(handler){
                var nextState = handler.getNextState();
                var logic = handler.getStateLogic();
                try{
                    data.defer = false;
                    if(logic){
                        retval = logic.call(interface, data);
                    }
                    //console.debug("StateMchine: event "+name+" has been just handled.");
                    if(nextState){
                        setCurrentState(nextState);
                        if(debugMode){
                            console.debug('jabche (debug): '+statemachineName+': current state is '+nextState.getName());                
                        }
                    }
                    
                    if(data.defer){
                        return false;
                    }
                    
                }catch(e){
                    handleError(e);
                    return true;
                }
                return retval;
            }else{
                return false;
            }
        }
        
        return {
            register : function(event){
                if(interface.hasOwnProperty(event)){
                    return;
                }else{
                    interface[event] = (function(data){
                        return execute(this, data || {});
                    }).bind(event);
                }
            },
            getInterface : function(){
                return interface;
            },
            substates: {}
        };
    }
    
    function EventHandler(name, nextState, handler){
        return {
            getStateLogic : function(){
                return handler;
            },
            getNextState : function(){
                return nextState;
            },
            getName : function(){
                return name;
            }
        };
    }
    
    function State(name, substates){
        var events = {};
        var onleave = null;
        var onenter = null;
        var substatemachine = substates;

        return {
            addHandler : function(eventName, handler, nextState){
                var eh = new EventHandler(eventName, nextState, handler);
                events[eventName] = eh;
                switch(eventName){
                    case 'leave':
                        onleave = eh;
                        break;
                    case 'enter':
                        onenter = eh;
                        break;
                }
            },
            getHandler : function(eventName){
                if(events.hasOwnProperty(eventName)){
                    return events[eventName];                    
                }  
                return null;
            },
            getName : function(){
                return name;
            },
            getOnLeave : function(){
                return onleave;
            },
            getOnEnter : function(){
                return onenter;
            },
            getSubstates : function(){
                return substatemachine;
            }
        };
    };
    
    function setCurrentState(state){
        
        if(currState && currState.getOnLeave() && currState.getOnLeave().getStateLogic()){
            var logic = currState.getOnLeave().getStateLogic();
            logic.call(eventHandlers.getInterface());
        }
        
        currState = state;
        
        if(state.getOnEnter() && state.getOnEnter().getStateLogic()){
            var logic = state.getOnEnter().getStateLogic();
            logic.call(eventHandlers.getInterface());
        }
    }
    
    function addState(name, isInitialState){
        if(!name){
            return;
        }
        if(!states[name]){
            var state = new State(name, eventHandlers.substates[name]);
            states[name] = state;
            if(isInitialState){
                setCurrentState(state);
                if(debugMode){
                    console.debug('jabche (debug): '+statemachineName+': initial state is set to '+state.getName());                
                }
            }
        }
    }
    
    function getState(name){
        return states[name];
    }
    
    function inheritSubstatesEvents(substates, handlers){
        for(var name in substates){
            if(typeof name == "function"){
                var event = name;
                handlers.register(event);                
            }
        }
    }
    
    function parseSubstates(substates, handlers){
        var list = {};
        for(var name in  substates){
            var item = substates[name];
            list[item.parent] = item.statemachine;
            inheritSubstatesEvents(item.statemachine, handlers);            
        }
        return list;
    }
    
    function initStates(transitions, initial, substates){
        for(var i = 0; i < transitions.length; i++){
            var event = transitions[i];
            var from = event['from'];
            var to = event['to'];
            addState(from, initial === from);
            addState(to, initial === to);
        }
    }
    
    function firstLetterUpper(word){
         return word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    function buildHandlerName(event, state){
        return "on"+firstLetterUpper(event)+firstLetterUpper(state);
    }
        
    function parseHandler(handler){
        var match = handler.match(handlerRegex);
        if(match){
            return {
                state:match[2],
                event:match[1]
            };
        }
        return false;
    }
    
    function parse(options){
        var transitions = options['transitions'];
        var handlers = options['handlers'];
        var init = options['init'];
        var constructor = options['constructor'];
        var substates = options['substates'];
        var handlerNames = {}; //expected handler names
        
        
        eventHandlers.substates = parseSubstates(substates, eventHandlers);
        initStates(transitions, init);
        

        //Let's parse transitions and their handlers
        for(var i = 0; i < transitions.length; i++){
            var event = transitions[i];
            var from = event['from'];
            var to = event['to'];
            var name = event['name'];
            
            if(!from || !to || !name){
                throw 'StateMachine '+statemachineName+': transition '+JSON.stringify(transitions[i]) + ' has wrong syntax.'+
                        'Expected fields: { name: "someevent", from: "somestate", to: "anotherstate" }';
            }
            var handlerName = buildHandlerName(name, from);
            handlerNames[handlerName] = true;
            var handler = handlers[handlerName];
            var state = getState(from);
            var next = getState(to);
            state.addHandler(name, handler, next);
            eventHandlers.register(name);
        }
        
        //Let's parse handlers which doesn't take part in any transition
        for(var name in handlers){
            if(handlerNames.hasOwnProperty(name)){
                continue;
            }
            var pair = parseHandler(name);
            if(pair){
                var state = states[pair.state.toLowerCase()];
                if(!state){
                    throw "StateMachine "+statemachineName+": handler "+name+" is misprinted or its state is not defined in any transition."+
                            "Expected syntax: on{$Someevent}{$Anystate}.";
                }
                var event = pair.event.toLowerCase();
                state.addHandler(event, handlers[name], null);
                eventHandlers.register(event);
            }
        }
        
        constructor(eventHandlers.getInterface());
    }
    
    parse(options);
    return eventHandlers.getInterface();
}

if(module){
    module.exports.StateMachine = StateMachine;
}
