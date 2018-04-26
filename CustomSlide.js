var isSpread = false;
var gt_key_suggestion_slide = 'Verwende die Pfeiltasten oder W-A-S-D zum Navigieren.';
var gt_key_tap = 'Klicke doppelt auf die Taste um die Seite zu wechseln';
var gt_key_tap_showed = false;

function initSlide() {
    $("#readerLink").on("click", function() {
        nextPageSlide(); return false;
    });
    
    $('#pages').html('<div class="number loaded"><a href="javascript:void(0);" >' + pages.length + '</a></a>');
    var list = '<ul id="listPages">';
    for (i = 0; i < pages.length; i++) {
        list += '<li><a data-p="'+(i + 1)+'" href="javascript:;">Page ' + (i + 1) + '</a></li>';
        $('#curPages').append('<div class="number number_' + i + '" style="display:none;"><a data-p="'+(i + 1)+'" href="javascript:void(0)">' + (i + 1) + '</a></div> ');
    }
    list += '</ul>';
    $('#allPages').html(list);
    
    $("#allPages a, #curPages a").on("click", function() {
        changePageSlide( $(this).attr("data-p"), false );
    });

    create_message('key_suggestion', 4000, gt_key_suggestion_slide);

    changePageSlide(current_page, true);

    var button_down = false;
    var button_down_code;
    jQuery(document).off('keydown');
    jQuery(document).on('keydown', function (e) {
        if (!button_down && !jQuery("input").is(":focus") && !jQuery("textarea").is(":focus") && jQuery('#reader').length > 0) {
            button_down = true;
            code = e.keyCode || e.which;
            if (code === 37 || code === 65)
            {
                if (!isSpread)
                    prevPageSlide();
                else if (e.timeStamp - timeStamp37 < 400 && e.timeStamp - timeStamp37 > 150)
                    prevPageSlide();
                timeStamp37 = e.timeStamp;

                button_down = true;
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $('#reader').scrollTo("-=13", {axis: 'x'});
                    }
                }, 20);
            }
            if (code === 39 || code === 68)
            {
                if (!isSpread)
                    nextPageSlide();
                else if (e.timeStamp - timeStamp39 < 400 && e.timeStamp - timeStamp39 > 150)
                    nextPageSlide();
                timeStamp39 = e.timeStamp;

                button_down = true;
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $('#reader').scrollTo("+=13", {axis: 'x'});
                    }
                }, 20);
            }


            if (code === 40 || code === 83)
            {
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $(document).scrollTo("+=13", {axis: 'y'});
                    }
                }, 20);
            }

            if (code === 38 || code === 87)
            {
                e.preventDefault();
                button_down_code = setInterval(function () {
                    if (button_down) {
                        $(document).scrollTo("-=13", {axis: 'y'});
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
};

function changePageSlide(page, init) {
    if (pages.length === 0) {
        alert("Fehler beim Laden des Kapitels. Bitte aktualisiere diese Seite.");
    } else if (page > pages.length) {
        $('#wrapper').css('max-width', '');
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

        $('#chapterImage').css('opacity', '0');
        if( typeof pages[page - 1][3] !== "undefined" ) {
            $('#chapterImage').attr('src', phpUrldecode(pages[page - 1][3]));
            $('#chapterImage').animate({'opacity': '1.0'}, 800);
        }

        resizePageSlide(page - 1);

        current_page = page;
        preloadSlide(preLoad);

        $(document).scrollTo($('#top'), 0);
    } else {
        changePageSlide(1, false);
    }
}

function nextPageSlide() {
    changePageSlide(current_page + 1, false);
}

function prevPageSlide() {
    changePageSlide(current_page - 1, false);
}

function preloadSlide(loadPages) {
    for( var i = 0; i < loadPages.length; i++ ) {
        if( typeof pages[ loadPages[i][0] ][3] === "undefined" ) {
            fetch( pages[ loadPages[i][0] ][0], loadPages[i][0], finishPreloadSlide );
        }
    }
}

function finishPreloadSlide( index ) {
    console.log("Current_Page: " + current_page);
    console.log("Current_Index: " + (index+1));
    if ( (index + 1) == current_page ) {
        console.log("Found match");
        $('#chapterImage').attr('src', phpUrldecode(pages[index][3]));
        $('#chapterImage').animate({'opacity': '1.0'}, 800);
    }
}

function resizePageSlide(id) {
    var doc_width = jQuery('#main').width();
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
    if (page_width > nice_width && (page_width / page_height) > 1.2) {
        $('#wrapper').css('max-width', '100%');
        if (page_height < 1610) {
            width = page_width;
            height = page_height;
        } else {
            height = 1600;
            width = page_width;
            width = (height * width) / (page_height);
        }
        jQuery("#reader").css({'max-width': 'none', 'overflow': 'auto'});
        jQuery("#reader").animate({scrollLeft: 9000}, 400);
        jQuery('#reader').attr({width: width, height: height});
        jQuery("#reader img").css({'max-width': '10000px'});
        jQuery('#reader img').attr({width: width, height: height});
        if (jQuery("#main").width() < jQuery("#reader img").width()) {
            isSpread = true;
            if (!gt_key_tap_showed) {
                gt_key_tap_showed = true;
                create_message('key_suggestion', 4000, gt_key_tap);
            }
        } else {
            jQuery("#reader").css({'max-width': width, 'overflow': 'hidden'});
            isSpread = false;
        }
        
    } else {
        $('#wrapper').css('max-width', '');
        if (page_width < nice_width && doc_width > page_width + 10) {
            width = page_width;
            height = page_height;
        } else {
            width = (doc_width > perfect_width) ? perfect_width : doc_width - 10;
            height = page_height;
            height = (height * width) / page_width;
        }
        jQuery('#reader img').attr({width: width, height: height});
        jQuery("#reader").css({'max-width': (width) + 'px', 'overflow': 'hidden'});
        jQuery("#reader img").css({'max-width': '100%'});
        isSpread = false;
    }
}

function phpUrldecode(str) {
    return decodeURIComponent((str + '').replace(/\+/g, '%20'));
}