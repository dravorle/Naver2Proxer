// ==UserScript==
// @name        Naver2Proxer
// @author      Dravorle
// @description Ermöglicht es weiterhin auch lizenzierte Naver-Manga direkt in Proxer zu lesen
// @include     https://proxer.me/chapter/*
// @supportURL  
// @updateURL   https://github.com/dravorle/Naver2Proxer/raw/master/Naver2Proxer.user.js
// @version     1.0: First Release
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require     https://proxer.me/templates/proxer14/js/jquery-ui-1.10.3.custom.min.js
// @require     https://proxer.me/templates/proxer14/js/jquery.plugins.js?3
// @require     CustomSlide.js
// @require     CustomLongstrip.js
// @connect     webtoons.com
// @connect     webtoon-phinf.pstatic.net
// @grant       GM_xmlhttpRequest
// @namespace   dravorle.proxer.me
// @run-at      document-end
// ==/UserScript==

run();
$(document).ajaxSuccess( function() {
    run();
});

function run() {
    /*
    $('[data-ajax="true"]').on('click', function(){
        setTimeout(run, 1500);
    });
    */
    
    if( $(".inner").text().indexOf("Dieses Kapitel ist leider noch nicht verfügbar :/") > -1 ) {
        console.log( "[Naver2Proxer] Kein Chapter verfügbar." );
        return;
    }

    //Prüfen ob das Chapter ein offizielles Webtoons-Chapter ist
    if( $("#chapter_next").attr("href").indexOf("webtoons.com") > -1 ) {
        console.log( "[Naver2Proxer] Offizielles Chapter entdeckt." );
        //Funktion des Links verändern, bei OnClick Webtoons-Seite laden und in Proxer-Style auf der Website anzeigen
        $("<script> pages = []; baseurl = '"+getCurrentLink().split("?")[0]+"'; current_page = 1; serverurl = ''; nextChapter = '"+$("a.menu:contains('Nächstes Kapitel')").attr("href")+"'; </script>").appendTo("head");
        //$('<script type="text/javascript" src="CustomSlide.js"></script>').appendTo("head");
        //$('<script type="text/javascript" src="CustomLongstrip.js"></script>').appendTo("head");

        $("#chapter_next").on("click", handleNaverClick );
        
        if( location.href.indexOf("?startRead") > -1 ) {
            $("#chapter_next").trigger("click");
            history.pushState(null, null, baseurl);
        }
    }
}

function handleNaverClick(e) {
    e.preventDefault();
    
    $("body").append('<div id="loading" class="customBubble" style="display:inline;"></div>');
    
    fetchImages();
}

function fetchImages() {
    console.log( "Loading Website" );
    GM_xmlhttpRequest({
        method: "GET",
        url: $("#chapter_next").attr("href"),
        onload: function(response) {
            $(response.responseText.trim()).find("#_imageList img").each( function() {
                pages.push( [ $(this).data("url"), $(this).attr("height"), $(this).attr("width") ] );

                enablePage( $(this).data("url"), $("#chapter_next").attr("href") );
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

//Funktion ruft einmalig das Bild auf um es für diese IP freizuschalten, dies wird von Naver benötigt, da das Bild erst dann angezeigt werden kann, wenn es 1x von der Naver-Seite aus aufgerufen wurde
function enablePage(url, base) {
    console.log( "Loading Image", url );
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        headers: {
            referer: base,
            origin: base
        },
        onload: function(response) {
            //Hier eventuell Seite in blob zwischenspeichern, oder so
        }
    });
}

function setReader() {
    set_cookie('manga_reader', $(this).attr("data-style"), cookie_expire);
    
    location.href = getCurrentLink() + "startRead";
}