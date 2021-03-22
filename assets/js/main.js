function textToSpans(el){
    var text = el.innerText;
	var charList = Array.from(text).map(function(ch){
		let span = document.createElement('span');
		span.innerText = ch;
    	return span;
	});
	el.innerHTML = '';
	charList.forEach(function(char){
		el.append(char);
	});

	return {
		text:function(){
			return text;
		},
		charList:function(){
			return charList;
		}
	}
}

jQuery(document).ready(function($) {

    $('#contact-me').on('click', () => {
      window.open('mailto:work@petar-todorov.com?subject=Online CV Form');
    });

    /*======= Skillset *=======*/

    $('.level-bar-inner').css('width', '0');


    var el = document.getElementsByClassName('name')[0];
    var obj = textToSpans(el);

    function runTextAnimations(){
            obj.charList().forEach(function(item, idx){
                    setTimeout(function(){
                            item.classList.add('char-effect');
                    }, 50*idx);

                    setTimeout(function(){
                            item.classList.remove('char-effect');
                    }, 50*(idx+1));
            });
    }


    function onpageload() {
            $('.level-bar-inner').each(function() {

                    var itemWidth = $(this).data('level');

                    $(this).animate({
                            width: itemWidth
                    }, 800);

            });
//            setTimeout(function(){
//                runTextAnimations();
//            }, 2000)


    };

    if(document.readyState === 'complete'){
        onpageload();
    }else{
    	$(window).on('load', onpageload);
    }

    /* Bootstrap Tooltip for Skillset */
    $('.level-label').tooltip();


    /* jQuery RSS - https://github.com/sdepold/jquery-rss */

    $("#rss-feeds").rss(

        //Change this to your own rss feeds
        "https://feeds.feedburner.com/TechCrunch/startups",

        {
        // how many entries do you want?
        // default: 4
        // valid values: any integer
        limit: 3,

        // the effect, which is used to let the entries appear
        // default: 'show'
        // valid values: 'show', 'slide', 'slideFast', 'slideSynced', 'slideFastSynced'
        effect: 'slideFastSynced',

        // will request the API via https
	    // default: false
	    // valid values: false, true
	    ssl: true,

        // outer template for the html transformation
        // default: "<ul>{entries}</ul>"
        // valid values: any string
        layoutTemplate: "<div class='items'>{entries}</div>",

        // inner template for each entry
        // default: '<li><a href="{url}">[{author}@{date}] {title}</a><br/>{shortBodyPlain}</li>'
        // valid values: any string
        entryTemplate: '<div class="item"><h3 class="title"><a href="{url}" target="_blank">{title}</a></h3><div><p>{shortBodyPlain}</p><a class="more-link" href="{url}" target="_blank"><i class="fas fa-external-link-alt"></i>Read more</a></div></div>'

        }
    );

    /* Github Calendar - https://github.com/IonicaBizau/github-calendar */
    //new GitHubCalendar("#github-graph", "SitkaCharley");

    /* Github Activity Feed - https://github.com/caseyscarborough/github-activity */
    GitHubActivity.feed({ selector: "#ghfeed" , username: "SitkaCharley"});

    var cover = document.getElementsByClassName('cover')[0];
    setTimeout(function(){
        cover.className = '';
    }, 300);

    cover.className += ' fade-in';
});
