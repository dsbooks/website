
// use to build book pages
function buildBook(id, series, title){
    $.getJSON("/books/books.json", function(json){

        // pull out the relevent book data
        let seriesNum = findSeriesNum(json, series);
        if (seriesNum === -1){
            $(id).html("<h1> BOOK INFO NOT FOUND </h1>");
            return;
        }
        let titleNum = findTitleNum(json.seriesList[seriesNum], title);
        if (titleNum === -1){
            $(id).html("<h1> BOOK INFO NOT FOUND </h1>");
            return;
        }
        let data = json.seriesList[seriesNum].bookList[titleNum];

        //////////////////////////////////////////////////
        //// the main book info section //////////////////
        //////////////////////////////////////////////////
        let $bookInfo = $("<div>").addClass("book-info");
        $bookInfo.appendTo(id);

        // add image and title in this h1
        createTitle(data, $bookInfo, false, "book-title", "book-img");

        // add tag line
        addTagLine(data, $bookInfo);

        // add the preblurb
        $("<strong>").addClass("preblurb")
                     .text(data.preBlurb)
                     .appendTo($bookInfo);

        // add the description
        generateDescription(data, $bookInfo);

        //////////////////////////////////////////////////
        //// the book purchase link section //////////////
        //////////////////////////////////////////////////
        
        // padding
        $("<br>").appendTo(id);
        $("<br>").appendTo(id);

        // create the container
        let $buyContainer = $("<div>").addClass("buy-section-container");
        $buyContainer.appendTo(id);

        // create the section
        let $buySection = $("<div>").addClass("buy-section");
        $buySection.appendTo($buyContainer);

        $("<h1>").text("Purchase Links").appendTo($buySection);

        // create the purchase link list
        let $buyList = $("<ul>").addClass("buy-list");
        $buyList.appendTo($buySection);

        tryMakingLink(data, $buyList, "amazon", "Amazon");
        tryMakingLink(data, $buyList, "bn", "Barnes&Noble");
        tryMakingLink(data, $buyList, "bam", "Books-A-Million");
        tryMakingLink(data, $buyList, "indie", "Indies");
    });
}

// find series number from series name
function findSeriesNum(data, name){
    for (var i = 0; i < data.seriesList.length; i++){
        if (data.seriesList[i].title === name){
            return i;
        }
    }
    return -1;
}

// find book number from series name
function findTitleNum(data, name){
    for (var i = 0; i < data.bookList.length; i++){
        if (data.bookList[i].title === name){
            return i;
        }
    }
    return -1;
}

// create a title with an image next to it
function createTitle(data, where, flat, titleClass, imageClass){
    let $bookTitle = $("<h1>").addClass(titleClass)
                              .text(data.title)
                              .css('color', data.titleColor)
                              .css('text-shadow', "0px 0px 4px " + data.titleShadow);
        $("<img>").addClass(imageClass)
                  .attr('src', '/img/' + (flat ? data.imageFileFlat : data.imageFile3D))
                  .appendTo($bookTitle);
        $bookTitle.appendTo(where);
}

// add a tag line
function addTagLine(data, where){
    $("<p>").addClass("book-tagline")
            .text("- " + data.tagLine + " -")
            .appendTo(where);
}

// generate the book description section
function generateDescription(data, where){
    let sections = data.fullBlurb.length;

    let $base = $("<p>").addClass("description-text");
    for (var i = 0; i < sections; i++){
        $("<p>").text(data.fullBlurb[i]).appendTo($base);
    }
    $base.appendTo(where);
}

// attempt to make a purchase link (do nothing if it fails)
function tryMakingLink(data, where, abbrev, text){
    let key = abbrev + "Link";
    if (data[key]){
        let $li = $("<li>").addClass("buy-list-item")
                           .addClass("buy-list-"+abbrev);
        $li.appendTo(where);
        $("<a>").attr("href", data[key])
                .text(text)
                .appendTo($li);
    }
}