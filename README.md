# jabche

This library works both on back-end and front-end side. I.e. Node.js server and client browser.

### Install

Via npm:

```bash
npm install --save jabche
```

On client side:

```html
<script src='state-machine.js'/>
```

### Usage

Get **jabche** module in Node.js:

```javascript
var jabche = require('jabche');
var StateMachine = jabche.StateMachine;
```

Next let's say we want to build a player. It will have 3 states: 'entry', 'idle' and 'playing'. Initially the player will be at state 'entry'. We specify it in `init` property from `options`.

```javascript
  var options = {
    init:'entry'
  }
```

In `transitions` we specify our state transitions. I.e. the relations between states:

```javascript
  var options = {
    init:'entry',
    transitions:[
        { name:'load',      from: 'entry',      to: 'idle'}, 
        { name:'play',      from: 'idle',       to: 'playing'}, 
        { name:'stop',      from: 'playing',    to: 'idle'} 
    ],
  }
  
```

The property `name` specifies the event that could trigger a transition from state `from` to state `to`. 
Each transition can be assosiated with a handler. We define these handlers in `handlers` property from `options` like so:

```javascript
  var options = {
    init:'entry',
    transitions:[
        { name:'load',      from: 'entry',      to: 'idle'}, 
        { name:'play',      from: 'idle',       to: 'playing'}, 
        { name:'stop',      from: 'playing',    to: 'idle'} 
    ],
    handlers:{
        onLoadEntry : function(){
            return new Promise((resolve)=>{
                setTimeout(resolve, 1000);
            });
        },
        onPlayIdle : function(sound){
            
        },
        onStopPlaying : function(){
            
        },
        onSeekPlaying : function(data){
            throw "You must send stop event before seek!";
        },
        onSeekIdle : function(data){
            this.seekData = data;
        }
    }    
  }

```
A handler naming convention follows this rule: `on` + `event name starting with upper-case` + `current state starting with upper-case`. Or in short `onEventCurrentstate`. For example if we want to define handle which will be triggered on 'load' event when state machine is in 'entry' state the name of the handler will be 'onLoadEntry'.

The `options` object can contain also another properties like `debug` - outputting debug info, `name` - the name of the state machine, `constructor` - the state machine's constructor and `substates` - to provide nested states hierarchy.

Let's resume:

```javascript

var options = {
    name:"PlayerFSM",
    debug:false, /*false is default*/
    init:'entry', /*the name of initial state*/
    constructor : function(ctx){ }, /*function triggers once the StateMachine object is initialized*/
    transitions:[     
        { name:'load',      from: 'entry',      to: 'idle'}, /* on event 'load' when in state 'entry' let's transit to 'idle' */
        { name:'play',      from: 'idle',       to: 'playing'}, /* on event 'play' when in state 'idle' let's transit to 'playing' */
        { name:'stop',      from: 'playing',    to: 'idle'}  /* on event 'stop' when in state 'playing' let's transit to 'idle' */
    ],
    handlers:{
        onLoadEntry : function(){  /* event handler triggers on 'load' event when in 'entry' state */
            return new Promise((resolve)=>{
                setTimeout(resolve, 1000);
            });
        },
        onPlayIdle : function(sound){ /* event handler triggers on 'play' event when in 'idle' state */
            
        },
        onStopPlaying : function(){ /* event handler triggers on 'stop' event when in 'playing' state */
            
        },
        onSeekPlaying : function(data){ /* event handler triggers on 'seek' event when in 'playing' state */
            throw "You must send stop event before seek!";
        },
        onSeekIdle : function(data){ /* event handler triggers on 'seek' event when in 'idle' state */
            this.seekData = data;
        }
    }
});

```

Now we're going to initialize the state machine with that `options` variable and demonstrate a simple example how to drive it by triggering events. Note that `onLoadEntry` handler returns a `Promise`. That will allow us to use the state machine with asynchronous operations like so:

```javascript
var sm = new StateMachine(options);

//current state is 'entry'
//let's trigger a 'load' event
hfsm.load().then(()=>{
    console.log("Player's loaded!");
    
    //current state is 'idle'
    //let's trigger a 'play' event
    hfsm.play();
    console.log("Player's playing.");
    
    //current state is 'playing'
    //let's try to trigger a 'seek' event
    try{
        hfsm.seek(1.34);
    }catch(err){
        console.error("Some exception caught: " + err);
    }
    
    //current state is still 'playing'
    //let's trigger a 'stop' event
    hfsm.stop();
    console.log("Player's stopped.");
    
    //current state is 'idle'
    //let's try to trigger a 'seek' event
    hfsm.seek(1.34);
    try{
        hfsm.seek(1.34);
        console.log('Starting position chanded!');
    }catch(err){
        console.error(err);
    }
});

```

```

By Petar Todorov 

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General
Public License as published by the Free Software Foundation; either version 2.1 of the License, or (at your option)
any later version.
This library is distributed in the hope that it will be useful,but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
details.
You should have received a copy of the GNU Lesser General Public License along with this library; if not, write to
the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA,
or connect to: http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
```
