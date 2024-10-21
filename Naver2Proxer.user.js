// ==UserScript==
// @name        Naver2Proxer
// @author      Dravorle
// @description Ermöglicht es weiterhin auch lizenzierte Naver-Manga direkt in Proxer zu lesen
// @include     https://proxer.me/chapter/*
// @supportURL  https://proxer.me/forum/283/384751
// @updateURL   https://github.com/dravorle/Naver2Proxer/raw/master/Naver2Proxer.user.js
// @version     1.5.5: Moved all Scripts into one because Firefox is sad
// @require     https://proxer.me/templates/proxer14/js/jquery-1.9.1.min.js
// @require     https://proxer.me/templates/proxer14/js/jquery-ui-1.10.3.custom.min.js
// @require     https://proxer.me/templates/proxer14/js/jquery.plugins.js?3
// @connect     webtoons.com
// @connect     webtoon-phinf.pstatic.net
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @namespace   dravorle.proxer.me
// @run-at      document-end
// ==/UserScript==

var MaxPages, CurrPages;
var version = "v1.5.5";

run();

function run() {
    unsafeWindow.jQuery(".inner a.menu[data-ajax]").off("click"); //Vorerst muss unsafeWindow genutzt werden, da ich Standard-Eventhandler unsubscriben muss, eine Funktion dafür wurde angefragt, bis dahin muss allerdings damit vorlieb genommen werden
    $('<meta name="referrer" content="same-origin">').appendTo("head");

    if ($(".inner").text().indexOf("Dieses Kapitel ist leider noch nicht verfügbar :/") > -1) {
        console.log("[Naver2Proxer] Kein Chapter verfügbar.");
        return;
    }

    //Prüfen ob das Chapter ein offizielles Webtoons-Chapter ist
    if ($("#chapter_next").attr("href").indexOf("webtoons.com") > -1) {
        console.log("[Naver2Proxer " + version + "] Offizielles Chapter entdeckt.");
        //Funktion des Links verändern, bei OnClick Webtoons-Seite laden und in Proxer-Style auf der Website anzeigen
        $(
            "<script> pages = []; baseurl = '" +
                getCurrentLink().split("?")[0] +
                "'; current_page = 1; serverurl = ''; nextChapter = '" +
                $("a.menu:contains('Nächstes Kapitel')").attr("href") +
                "'; </script>"
        ).appendTo("head");

        if (nextChapter === "undefined") {
            console.log("[Naver2Proxer] Letztes Chapter erreicht.");
            nextChapter = $("#simple-navi a[href]:contains('Kapitel')").attr("href").replace("list", "relation");
        }

        $("#chapter_next").on("click", handleNaverClick);

        unsafeWindow.jQuery(document).off("keydown"); //Vorerst muss unsafeWindow genutzt werden, da ich Standard-Eventhandler unsubscriben muss, eine Funktion dafür wurde angefragt, bis dahin muss allerdings damit vorlieb genommen werden
        //removeEventHandler( document, "keydown" ); //Funktion von Enes angefragt

        $(document).on("keydown", function (e) {
            var code = e.keyCode || e.which;
            if (code === 39 || code === 68) {
                handleNaverClick(e);
            }
        });

        if (location.href.indexOf("?startRead") > -1) {
            $("#chapter_next").trigger("click");
            history.pushState(null, null, baseurl);
        }
    }
}

function handleNaverClick(e) {
    e.preventDefault();

    if ($("#loading").length > 0) {
        return;
    }

    $("body").append('<div id="loading" class="customBubble" style="display:inline;"></div>');

    fetchImages();
}

function fetchImages() {
    console.log("Loading Website");
    GM_xmlhttpRequest({
        method: "GET",
        url: $("#chapter_next").attr("href"),
        headers: {
            referer: $("#chapter_next").attr("href"),
            origin: $("#chapter_next").attr("href"),
            "X-Requested-With": $("#chapter_next").attr("href"),
            cookie: "pagGDPR=true;rstagGDPR_DE=true;"
        },
        onload: function (response) {
            maxPages = $(response.responseText.trim()).find("#_imageList img").length;
            currPages = 0;
            $(response.responseText.trim())
                .find("#_imageList img")
                .each(function (i) {
                    pages.push([$(this).data("url"), $(this).attr("height"), $(this).attr("width")]);
                });

            buildProxerReader(get_cookie("manga_reader"));
        }
    });
}

function buildProxerReader(style) {
    var title =
        "[Naver] <a href='" +
        baseurl +
        "'>" +
        $("table.details tr:eq(0) td:eq(1)").text() +
        "</a> (Chapter " +
        baseurl.split("/")[5] +
        ")";
    $("#main > *").remove();

    $(
        "<div id='panel'> <div id='breadcrumb'>" +
            title +
            "</div> <div id='navigation'> <span id='curPages'></span> <span id='pages'></span> <span id='allPages'></span> </div> <div id='readers' style='position:relative;float:right;margin:0 20px;font-size: 20px;'><a style='margin:5px;' class='menu" +
            (style === "slide" ? " active" : "") +
            "' data-style='slide' title='Standardreader' href='javascript:;'><i class='fa fa-arrows-h'></i></a><a style='margin:5px;' class='menu" +
            (style === "slide" ? "" : " active") +
            "' data-style='longstrip' title='Longstrip-Reader' href='javascript:;'><i class='fa fa-arrows-v'></i></a> </div> <div style='clear:both'></div> </div> <div id='reader' align='center'> <a id='readerLink' href='javascript:;'> <img id='chapterImage' /> </a </div> "
    ).appendTo("#main");
    $("#readers a.menu").on("click", setReader);

    $('<link rel="stylesheet" type="text/css" href="/components/com_proxer/css/read/default.css">').appendTo("#main");

    history.pushState(null, null, window.location.href);

    $("#loading").remove();
    if (style === "slide") {
        initSlide();
    } else if (style === "longstrip") {
        initLong();
    } else {
        initSlide();
    }
}

function fetch(url, index, callback) {
    console.log("Preloading Image of index " + index, url);
    GM_xmlhttpRequest({
        method: "get",
        responseType: "blob",
        url: url,
        headers: {
            referer: url,
            origin: url,
            "X-Requested-With": url
        },
        onload: function (response) {
            var urlCreator = window.URL || window.webkitURL;
            pages[index].push(urlCreator.createObjectURL(response.response));
            callback(index);
        }
    });
}

function setReader() {
    set_cookie("manga_reader", $(this).attr("data-style"), cookie_expire);

    location.href = getCurrentLink() + "startRead";
}

//###########################

var isSpread = false;
var gt_key_tap_showed = false;
var scrollable = false;
var scroll = true;
var counter = 0;

//#####CustomSlide-Logic#####

function initSlide() {
    $("#readerLink").on("click", function () {
        nextPageSlide();
        return false;
    });

    $("#pages").html('<div class="number loaded"><a href="javascript:void(0);" >' + pages.length + "</a></a>");
    var list = '<ul id="listPages">';
    for (i = 0; i < pages.length; i++) {
        list += '<li><a data-p="' + (i + 1) + '" href="javascript:;">Page ' + (i + 1) + "</a></li>";
        $("#curPages").append(
            '<div class="number number_' +
                i +
                '" style="display:none;"><a data-p="' +
                (i + 1) +
                '" href="javascript:void(0)">' +
                (i + 1) +
                "</a></div> "
        );
    }
    list += "</ul>";
    $("#allPages").html(list);

    $("#allPages a, #curPages a").on("click", function () {
        changePageSlide($(this).attr("data-p"), false);
    });

    create_message("key_suggestion", 4000, "Verwende die Pfeiltasten oder W-A-S-D zum Navigieren.");

    changePageSlide(current_page, true);

    var button_down = false;
    var button_down_code;
    jQuery(document).off("keydown");
    jQuery(document).on("keydown", function (e) {
        if (
            !button_down &&
            !jQuery("input").is(":focus") &&
            !jQuery("textarea").is(":focus") &&
            jQuery("#reader").length > 0
        ) {
            button_down = true;
            code = e.keyCode || e.which;
            if (code === 37 || code === 65) {
                if (!isSpread) prevPageSlide();
                else if (e.timeStamp - timeStamp37 < 400 && e.timeStamp - timeStamp37 > 150) prevPageSlide();
                timeStamp37 = e.timeStamp;

                button_down = true;
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $("#reader").scrollTo("-=13", { axis: "x" });
                    }
                }, 20);
            }
            if (code === 39 || code === 68) {
                if (!isSpread) nextPageSlide();
                else if (e.timeStamp - timeStamp39 < 400 && e.timeStamp - timeStamp39 > 150) nextPageSlide();
                timeStamp39 = e.timeStamp;

                button_down = true;
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $("#reader").scrollTo("+=13", { axis: "x" });
                    }
                }, 20);
            }

            if (code === 40 || code === 83) {
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $(document).scrollTo("+=13", { axis: "y" });
                    }
                }, 20);
            }

            if (code === 38 || code === 87) {
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $(document).scrollTo("-=13", { axis: "y" });
                    }
                }, 20);
            }
        }
    });
    jQuery(document).keyup(function (e) {
        button_down_code = window.clearInterval(button_down_code);
        button_down = false;
    });

    timeStamp37 = 0;
    timeStamp39 = 0;
}

function changePageSlide(page, init) {
    if (pages.length === 0) {
        alert("Fehler beim Laden des Kapitels. Bitte aktualisiere diese Seite.");
    } else if (page > pages.length) {
        $("#wrapper").css("max-width", "");
        window.location = nextChapter + "#top";
    } else if (page > 0) {
        var p = page - 1;
        var preLoad = new Array();
        for (i = 0; i < pages.length; i++) {
            if ((i < p && i + 3 > p) || (i > p && i - 3 < p) || i === p) {
                $(".number_" + i).css("display", "");
                if (i === p) {
                    $(".number_" + i).addClass("current_page");
                } else {
                    $(".number_" + i).removeClass("current_page");
                }
                preLoad.push(new Array(i, phpUrldecode(pages[i][0])));
            } else {
                if (i > p && i - 6 < p) {
                    preLoad.push(new Array(i, phpUrldecode(pages[i][0])));
                }
                $(".number_" + i).css("display", "none");
            }
        }

        $("#chapterImage").css("opacity", "0");
        if (typeof pages[page - 1][3] !== "undefined") {
            $("#chapterImage").attr("src", phpUrldecode(pages[page - 1][3]));
            $("#chapterImage").animate({ opacity: "1.0" }, 800);
        }

        resizePageSlide(page - 1);

        current_page = page;
        preloadSlide(preLoad);

        $(document).scrollTo($("#top"), 0);
    } else {
        changePageSlide(1, false);
    }
}

function nextPageSlide() {
    changePageSlide(+current_page + 1, false);
}

function prevPageSlide() {
    changePageSlide(+current_page - 1, false);
}

function preloadSlide(loadPages) {
    for (var i = 0; i < loadPages.length; i++) {
        if (typeof pages[loadPages[i][0]][3] === "undefined") {
            fetch(pages[loadPages[i][0]][0], loadPages[i][0], finishPreloadSlide);
        }
    }
}

function finishPreloadSlide(index) {
    if (index + 1 == current_page) {
        $("#chapterImage").attr("src", phpUrldecode(pages[index][3]));
        $("#chapterImage").animate({ opacity: "1.0" }, 800);
    }
}

function resizePageSlide(id) {
    var doc_width = jQuery("#main").width();
    var page_width = parseInt(pages[id][2]);
    var page_height = parseInt(pages[id][1]);
    var nice_width = 980;
    var perfect_width = 980;

    if (doc_width > 1200) {
        nice_width = 1200;
        perfect_width = doc_width;
    }
    if (doc_width > 1600) {
        nice_width = 1400;
        perfect_width = 1300;
    }
    if (doc_width > 1800) {
        nice_width = 1600;
        perfect_width = 1500;
    }
    if (page_width > nice_width && page_width / page_height > 1.2) {
        $("#wrapper").css("max-width", "100%");
        if (page_height < 1610) {
            width = page_width;
            height = page_height;
        } else {
            height = 1600;
            width = page_width;
            width = (height * width) / page_height;
        }
        jQuery("#reader").css({ "max-width": "none", overflow: "auto" });
        jQuery("#reader").animate({ scrollLeft: 9000 }, 400);
        jQuery("#reader").attr({ width: width, height: height });
        jQuery("#reader img").css({ "max-width": "10000px" });
        jQuery("#reader img").attr({ width: width, height: height });
        if (jQuery("#main").width() < jQuery("#reader img").width()) {
            isSpread = true;
            if (!gt_key_tap_showed) {
                gt_key_tap_showed = true;
                create_message("key_suggestion", 4000, "Klicke doppelt auf die Taste um die Seite zu wechseln");
            }
        } else {
            jQuery("#reader").css({ "max-width": width, overflow: "hidden" });
            isSpread = false;
        }
    } else {
        $("#wrapper").css("max-width", "");
        if (page_width < nice_width && doc_width > page_width + 10) {
            width = page_width;
            height = page_height;
        } else {
            width = doc_width > perfect_width ? perfect_width : doc_width - 10;
            height = page_height;
            height = (height * width) / page_width;
        }
        jQuery("#reader img").attr({ width: width, height: height });
        jQuery("#reader").css({ "max-width": width + "px", overflow: "hidden" });
        jQuery("#reader img").css({ "max-width": "100%" });
        isSpread = false;
    }
}

function phpUrldecode(str) {
    return decodeURIComponent((str + "").replace(/\+/g, "%20"));
}

//###########################

//###CustomLongstrip-Logic###

function initLong() {
    $("#readerLink").on("click", function () {
        nextPageLong();
        return false;
    });

    $("#pages").html('<div class="number loaded"><a href="javascript:void(0);" >' + pages.length + "</a></a>");
    var list = '<ul id="listPages">';
    var images = "";
    for (i = 0; i < pages.length; i++) {
        list += '<li><a data-p="' + (i + 1) + '" href="javascript:;">Page ' + (i + 1) + "</a></li>";
        $("#curPages").append(
            '<div class="number number_' +
                i +
                '" style="display:none;"><a data-p="' +
                (i + 1) +
                '" href="javascript:void(0)">' +
                (i + 1) +
                "</a></div> "
        );

        images +=
            '<img style="display:block;" class="unloaded" id="chapterImage' +
            i +
            '" width="' +
            Math.min(pages[i][2], $("#reader").width()) +
            '" height="' +
            Math.round((Math.min(pages[i][2], $("#reader").width()) * pages[i][1]) / pages[i][2]) +
            '" />';
    }
    list += "</ul>";
    $("#allPages").html(list);
    $("#reader").html('<a href="javascript:void(0);">' + images + "</a>");

    $("#allPages a, #curPages a").on("click", function () {
        changePageLong($(this).attr("data-p"), false);
    });

    $("#reader img").on("click", function () {
        nextChap();
    });

    create_message(
        "key_suggestion",
        7000,
        "Verwende W/S bzw. Pfeil oben/unten zum scrollen.<br>" +
            "Doppelklicke auf A/D bzw. Pfeil links/rechts um das Kapitel zu wechseln.<br>" +
            "Drücke am Ende eines Kapitels D/Pfeil rechts, um das nächste Kapitel zu erreichen."
    );

    changePageLong(current_page, true);

    if (nextChapter === "/mcp?section=manga&s=updatesnew#top") {
        $("#panel").attr(
            "style",
            "position:fixed;top:42px;left:50%;width:" +
                ($("#reader").width() - 10) +
                "px;margin-left:-" +
                $("#reader").width() / 2 +
                "px;"
        );
    }

    var button_down = false;
    var button_down_code;
    jQuery(document).off("keydown");
    jQuery(document).on("keydown", function (e) {
        if (
            !button_down &&
            !jQuery("input").is(":focus") &&
            !jQuery("textarea").is(":focus") &&
            jQuery("#reader").length > 0
        ) {
            button_down = true;
            code = e.keyCode || e.which;
            var windowheight = $(window).height() - 50;
            if (e.keyCode === 37 || e.keyCode === 65) {
                if (e.timeStamp - timeStamp37 < 250 && e.timeStamp - timeStamp37 > 100) thisChap();
                timeStamp37 = e.timeStamp;
                $(window).scrollTo("-=" + windowheight);
                button_down = true;
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $(window).scrollTo("-=" + windowheight);
                    }
                }, 200);
            }
            if (e.keyCode === 39 || e.keyCode === 68) {
                if (e.timeStamp - timeStamp39 < 250 && e.timeStamp - timeStamp39 > 100) nextChap();
                timeStamp39 = e.timeStamp;
                $(window).scrollTo("+=" + windowheight);
                if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
                    setTimeout(nextChap, 1500);
                }
                button_down = true;
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
                        setTimeout(nextChap, 1500);
                    }
                    if (button_down) {
                        $(window).scrollTo("+=" + windowheight);
                    }
                }, 200);
            }

            if (code === 40 || code === 83) {
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        jQuery.scrollTo("+=13");
                    }
                }, 20);
            }

            if (code === 38 || code === 87) {
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        jQuery.scrollTo("-=13");
                    }
                }, 20);
            }
        }
    });
    jQuery(document).keyup(function (e) {
        button_down_code = window.clearInterval(button_down_code);
        button_down = false;
    });

    $(window).off("scroll");
    $(window).on("scroll", function (e) {
        var loop = true;
        while (loop) {
            var position = $("#chapterImage" + (current_page - 1)).position().top;
            var scrolled = $(window).scrollTop();
            var curHeight = $("#chapterImage" + (current_page - 1)).height();
            var prevHeight = 10000;
            if (current_page - 2 >= 0) {
                prevHeight = $("#chapterImage" + (current_page - 2)).height();
            }

            if (scrollable && scrolled - position >= curHeight) {
                scroll = false;
                nextPageLong();
            } else if (scrollable && position - scrolled >= prevHeight) {
                scroll = false;
                prevPageLong();
            } else {
                loop = false;
            }
        }

        if (!scrollable && counter > 1) {
            scrollable = true;
        }
        counter++;
    });

    timeStamp37 = 0;
    timeStamp39 = 0;
}

function changePageLong(page, init) {
    if (pages.length === 0) {
        alert("Fehler beim Laden des Kapitels. Bitte aktualisiere diese Seite.");
    } else if (page > pages.length) {
        $("#wrapper").css("max-width", "");
        //ajaxProxerRequest(nextChapter);
        window.location = nextChapter + "#top";
    } else if (page > 0) {
        var p = page - 1;

        var preLoad = new Array();
        for (i = 0; i < pages.length; i++) {
            if ((i < p && i + 3 > p) || (i > p && i - 3 < p) || i === p) {
                $(".number_" + i).css("display", "");
                if (i === p) {
                    $(".number_" + i).addClass("current_page");
                } else {
                    $(".number_" + i).removeClass("current_page");
                }
                preLoad.push(new Array(i, phpUrldecode(pages[i][0])));
            } else {
                if (i > p && i - 6 < p) {
                    preLoad.push(new Array(i, phpUrldecode(pages[i][0])));
                }
                $(".number_" + i).css("display", "none");
            }
        }

        if (scroll) {
            if (page - 1 !== 0) {
                window.scrollTo(0, $("#chapterImage" + (page - 1)).offset().top - 50);
                setTimeout(function () {
                    window.scrollTo(0, $("#chapterImage" + (page - 1)).offset().top - 50);
                }, 80);
            } else {
                var amount = 0;
                var tmode = get_cookie("tmode");
                if (tmode === "ht" || tmode === "") {
                    amount = 300;
                }
                window.scrollTo(0, amount);
            }
        }
        scroll = true;

        current_page = page;
        preloadLong(preLoad);
    } else {
        changePageLong(1, false);
    }
}

function thisChap() {
    $("#wrapper").css("max-width", "");
    //ajaxProxerRequest(nextChapter);
    window.location = window.location.href.split("chapter")[1] + "#top";
}

function nextChap() {
    $("#wrapper").css("max-width", "");
    //ajaxProxerRequest(nextChapter);
    window.location = nextChapter + "#top";
}

function nextPageLong() {
    changePageLong(+current_page + 1, false);
}

function prevPageLong() {
    changePageLong(+current_page - 1, false);
}

function preloadLong(loadPages) {
    for (var i = 0; i < loadPages.length; i++) {
        if (typeof pages[loadPages[i][0]][3] === "undefined") {
            fetch(pages[loadPages[i][0]][0], loadPages[i][0], finishPreloadLong);
        }
    }
}

function finishPreloadLong(index) {
    $(".number_" + index).addClass("loaded");

    if ($("#chapterImage" + index).hasClass("unloaded")) {
        $("#chapterImage" + index).removeClass("unloaded");
        $("#chapterImage" + index).css("opacity", "1");
        $("#chapterImage" + index).attr("src", phpUrldecode(pages[index][3]));
    }
}
//###########################
