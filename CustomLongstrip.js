var isSpread = false;
var scrollable = false;
var scroll = true;
var counter = 0;
var gt_key_suggestion_long = 'Verwende W/S bzw. Pfeil oben/unten zum scrollen.<br>' +
        'Doppelklicke auf A/D bzw. Pfeil links/rechts um das Kapitel zu wechseln.<br>' +
        'DrÃ¼cke am Ende eines Kapitels D/Pfeil rechts, um das nÃ¤chste Kapitel zu erreichen.';

function initLong() {
    $("#readerLink").on("click", function() {
        nextPageLong(); return false;
    });

    $('#pages').html('<div class="number loaded"><a href="javascript:void(0);" >' + pages.length + '</a></a>');
    var list = '<ul id="listPages">';
    var images = '';
    for (i = 0; i < pages.length; i++) {
        list += '<li><a data-p="'+(i + 1)+'" href="javascript:;>Page ' + (i + 1) + '</a></li>';
        $('#curPages').append('<div class="number number_' + i + '" style="display:none;"><a data-p="'+(i + 1)+'" href="javascript:void(0)">' + (i + 1) + '</a></div> ');

        images += '<img class="unloaded" style="display:block;" src="/templates/proxer14/images/bg60.png" id="chapterImage' + i + '" width="' + Math.min(pages[i][2], $('#reader').width()) + '" height="' +
                Math.round(Math.min(pages[i][2], $('#reader').width()) * pages[i][1] / pages[i][2]) + '" />';
    }
    list += '</ul>';
    $('#allPages').html(list);
    $('#reader').html('<a href="javascript:void(0);">' + images + '</a>');

    $("#allPages a, #curPages a").on("click", function() {
        changePageLong( $(this).attr("data-p"), false );
    });
    
    $("#reader img").on("click", function() {
        nextChap();
    });

    create_message('key_suggestion', 7000, gt_key_suggestion_long);

    changePageLong(current_page, true);

    if (nextChapter === '/mcp?section=manga&s=updatesnew#top') {
        $('#panel').attr('style', 'position:fixed;top:42px;left:50%;width:' + ($('#reader').width() - 10) + 'px;margin-left:-' + ($('#reader').width() / 2) + 'px;');
    }

    var button_down = false;
    var button_down_code;
    jQuery(document).off('keydown');
    jQuery(document).on('keydown', function (e) {
        if (!button_down && !jQuery("input").is(":focus") && !jQuery("textarea").is(":focus") && jQuery('#reader').length > 0) {
            button_down = true;
            code = e.keyCode || e.which;
            var windowheight = $(window).height() - 50;
            if (e.keyCode === 37 || e.keyCode === 65)
            {
                if (e.timeStamp - timeStamp37 < 250 && e.timeStamp - timeStamp37 > 100)
                    thisChap();
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
            if (e.keyCode === 39 || e.keyCode === 68)
            {
                if (e.timeStamp - timeStamp39 < 250 && e.timeStamp - timeStamp39 > 100)
                    nextChap();
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


            if (code === 40 || code === 83)
            {
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        jQuery.scrollTo("+=13");
                    }
                }, 20);
            }

            if (code === 38 || code === 87)
            {
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

    $(window).off('scroll');
    $(window).on('scroll', function (e) {
        var loop = true;
        while (loop) {
            var position = $('#chapterImage' + (current_page - 1)).position().top;
            var scrolled = $(window).scrollTop();
            var curHeight = $('#chapterImage' + (current_page - 1)).height();
            var prevHeight = 10000;
            if (current_page - 2 >= 0) {
                prevHeight = $('#chapterImage' + (current_page - 2)).height()
            }

            if (scrollable && (scrolled - position) >= curHeight) {
                scroll = false;
                nextPageLong();
            } else if (scrollable && (position - scrolled) >= prevHeight) {
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
};

function changePageLong(page, init) {
    if (pages.length === 0) {
        alert("Fehler beim Laden des Kapitels. Bitte aktualisiere diese Seite.");
    } else if (page > pages.length) {
        $('#wrapper').css('max-width', '');
        //ajaxProxerRequest(nextChapter);
        window.location = nextChapter + '#top';
    } else if (page > 0) {
        var p = page - 1;
        var preLoad = new Array();
        for (i = 0; i < pages.length; i++) {

            if ((i < p && i + 3 > p) || (i > p && i - 3 < p) || i === p) {
                $('.number_' + i).css('display', '');
                if (i === p) {
                    $('.number_' + i).addClass('current_page');
                } else {
                    $('.number_' + i).removeClass('current_page');
                }
                preLoad.push(new Array(i, phpUrldecode(pages[i][0])));
            } else {
                if ((i > p && i - 6 < p)) {
                    preLoad.push(new Array(i, phpUrldecode(pages[i][0])));
                }
                $('.number_' + i).css('display', 'none');
            }
        }
        if (scroll) {
            //$.scrollTo(jQuery('#chapterImage'+(page-1)).position().top-50,0);
            //$(document).scrollTop($('#chapterImage'+(page-1)).offset().top-50);
            if (page - 1 !== 0) {
                window.scrollTo(0, $('#chapterImage' + (page - 1)).offset().top - 50);
                setTimeout(function () {
                    window.scrollTo(0, $('#chapterImage' + (page - 1)).offset().top - 50);
                }, 80);
            } else {
                var amount = 0;
                var tmode = get_cookie('tmode');
                if (tmode === 'ht' || tmode === '') {
                    amount = 300;
                }
                window.scrollTo(0, amount);
            }
        }
        scroll = true;

        current_page = page;
        imagePreloadLong(preLoad);

        for (i = 0; i < preLoad.length; i++) {
            var pre = preLoad[i][0];
            if ($('#chapterImage' + pre).hasClass("unloaded")) {
                $('#chapterImage' + pre).removeClass("unloaded");
                $('#chapterImage' + pre).css('opacity', '1');
                $('#chapterImage' + pre).attr('src', preLoad[i][1]);
            }
        }
    } else {
        changePageLong(1, false);
    }
}

function thisChap() {
    $('#wrapper').css('max-width', '');
    //ajaxProxerRequest(nextChapter);
    window.location = window.location.href.split('chapter')[1] + '#top';
}

function nextChap() {
    $('#wrapper').css('max-width', '');
    //ajaxProxerRequest(nextChapter);
    window.location = nextChapter + '#top';
}

function nextPageLong() {
    changePageLong(current_page + 1, false);
}

function prevPageLong() {
    changePageLong(current_page - 1, false);
}

function imagePreloadLong(loadPages) {
    var pageIndex = new Array();
    var pageImages = new Array();
    for (i = 0; i < loadPages.length; i++) {
        pageIndex.push(loadPages[i][0]);
        pageImages.push(loadPages[i][1]);
    }
    jQuery.preload(pageImages, {
        threshold: 40,
        enforceCache: true,
        onComplete: function (data)
        {
            var idx = data.index;

            $('.number_' + pageIndex[idx]).addClass('loaded');
            if (pageIndex[idx] + 1 === current_page) {
                //$('#chapterImage').animate({'opacity':'1.0'}, 800);
            }
        }

    });
}