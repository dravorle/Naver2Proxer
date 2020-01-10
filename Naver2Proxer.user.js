// ==UserScript==
// @name        Naver2Proxer
// @author      Dravorle
// @description Ermöglicht es weiterhin auch lizenzierte Naver-Manga direkt in Proxer zu lesen
// @include     https://proxer.me/chapter/*
// @supportURL  https://proxer.me/forum/283/384751
// @updateURL   https://github.com/dravorle/Naver2Proxer/raw/master/Naver2Proxer.user.js
// @version     1.5.3: Added "AgeGatePass"-Cookie to the request in order to access the website
// @history     1.5.2: Fixed error when current chapter is the last one of the manga.
// @history     1.5.1: Fixed small calculation error
// @history     1.5: Switched to using a Preloader-Function to speed up load times
// @history     1.4: Switched from using the Preloader-Function to storing the data in a blob on first retrieval
// @history     1.3.1: Few more fixes
// @history     1.3: Fixed Event assigning for Custom Reader Functions
// @history     1.2.1: Fixed Pages loading more than once
// @history     1.2: Fixed Event Handling on Chapter-Page
// @history     1.1: Small fixes
// @history     1.0: First Release
// @require     https://proxer.me/templates/proxer14/js/jquery-1.9.1.min.js
// @require     https://proxer.me/templates/proxer14/js/jquery-ui-1.10.3.custom.min.js
// @require     https://proxer.me/templates/proxer14/js/jquery.plugins.js?3
// @require     CustomSlide.js
// @require     CustomLongstrip.js
// @connect     webtoons.com
// @connect     webtoon-phinf.pstatic.net
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @namespace   dravorle.proxer.me
// @run-at      document-end
// ==/UserScript==

var MaxPages, CurrPages;
var version = "v1.5.2";

run();

function run() {
    unsafeWindow.jQuery( ".inner a.menu[data-ajax]" ).off("click"); //Vorerst muss unsafeWindow genutzt werden, da ich Standard-Eventhandler unsubscriben muss, eine Funktion dafür wurde angefragt, bis dahin muss allerdings damit vorlieb genommen werden
    $('<meta name="referrer" content="same-origin">').appendTo("head");

    if( $(".inner").text().indexOf("Dieses Kapitel ist leider noch nicht verfügbar :/") > -1 ) {
        console.log( "[Naver2Proxer] Kein Chapter verfügbar." );
        return;
    }

    //Prüfen ob das Chapter ein offizielles Webtoons-Chapter ist
    if( $("#chapter_next").attr("href").indexOf("webtoons.com") > -1 ) {
        console.log( "[Naver2Proxer "+version+"] Offizielles Chapter entdeckt." );
        //Funktion des Links verändern, bei OnClick Webtoons-Seite laden und in Proxer-Style auf der Website anzeigen
        $("<script> pages = []; baseurl = '"+getCurrentLink().split("?")[0]+"'; current_page = 1; serverurl = ''; nextChapter = '"+$("a.menu:contains('Nächstes Kapitel')").attr("href")+"'; </script>").appendTo("head");

		if( nextChapter === "undefined" ) {
			console.log( "[Naver2Proxer] Letztes Chapter erreicht." );
			nextChapter = $( "#simple-navi a[href]:contains('Kapitel')" ).attr( "href" ).replace( "list", "relation" );
		}

        $("#chapter_next").on("click", handleNaverClick );

        unsafeWindow.jQuery(document).off("keydown"); //Vorerst muss unsafeWindow genutzt werden, da ich Standard-Eventhandler unsubscriben muss, eine Funktion dafür wurde angefragt, bis dahin muss allerdings damit vorlieb genommen werden
        //removeEventHandler( document, "keydown" ); //Funktion von Enes angefragt

        $(document).on("keydown", function(e) {
            var code = e.keyCode || e.which;
            if ( code === 39 || code === 68 ) {
                handleNaverClick(e);
            }
        });

        if( location.href.indexOf("?startRead") > -1 ) {
            $("#chapter_next").trigger("click");
            history.pushState(null, null, baseurl);
        }
    }
}

function handleNaverClick(e) {
    e.preventDefault();

    if( $("#loading").length > 0 ) {
        return;
    }

    $("body").append('<div id="loading" class="customBubble" style="display:inline;"></div>');

    fetchImages();
}

function fetchImages() {
    console.log( "Loading Website" );
    GM_xmlhttpRequest({
        method: "GET",
        url: $("#chapter_next").attr("href"),
        headers: {
            referer: $("#chapter_next").attr("href"),
            origin: $("#chapter_next").attr("href"),
            "X-Requested-With": $("#chapter_next").attr("href"),
	    cookie: "AgeGatePass=true"
        },
        onload: function(response) {
            maxPages = $(response.responseText.trim()).find("#_imageList img").length;
            currPages = 0;
            $(response.responseText.trim()).find("#_imageList img").each( function(i) {
                pages.push( [ $(this).data("url"), $(this).attr("height"), $(this).attr("width") ] );
            });

            buildProxerReader( get_cookie("manga_reader") );
        }
    });
}

function buildProxerReader( style ) {
    var title = "[Naver] <a href='"+baseurl+"'>"+ $("table.details tr:eq(0) td:eq(1)").text() + "</a> (Chapter " + baseurl.split("/")[5] + ")";
    $("#main > *").remove();

    $("<div id='panel'> <div id='breadcrumb'>"+title+"</div> <div id='navigation'> <span id='curPages'></span> <span id='pages'></span> <span id='allPages'></span> </div> <div id='readers' style='position:relative;float:right;margin:0 20px;font-size: 20px;'><a style='margin:5px;' class='menu"+( ( style === "slide" )?" active":"" )+"' data-style='slide' title='Standardreader' href='javascript:;'><i class='fa fa-arrows-h'></i></a><a style='margin:5px;' class='menu"+( ( style === "slide" )?"":" active" )+"' data-style='longstrip' title='Longstrip-Reader' href='javascript:;'><i class='fa fa-arrows-v'></i></a> </div> <div style='clear:both'></div> </div> <div id='reader' align='center'> <a id='readerLink' href='javascript:;'> <img id='chapterImage' /> </a </div> ").appendTo("#main");
    $("#readers a.menu").on("click", setReader);

    $('<link rel="stylesheet" type="text/css" href="/components/com_proxer/css/read/default.css">').appendTo("#main");

    history.pushState(null, null, window.location.href);

    $("#loading").remove();
    if( style === "slide" ) {
        initSlide();
    } else if( style === "longstrip" ) {
        initLong();
    } else {
        initSlide();
    }
}

function fetch( url, index, callback ) {
    console.log( "Preloading Image of index "+index, url );
    GM_xmlhttpRequest({
        method: "get",
        responseType: "blob",
        url: url,
        headers: {
            referer: url,
            origin: url,
            "X-Requested-With": url
        },
        onload: function(response) {
            var urlCreator = window.URL || window.webkitURL;
            pages[index].push( urlCreator.createObjectURL( response.response ) );
            callback(index);
        }
    });
}

function setReader() {
    set_cookie('manga_reader', $(this).attr("data-style"), cookie_expire);

    location.href = getCurrentLink() + "startRead";
}
