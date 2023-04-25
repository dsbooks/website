//////////////////////////////////////////////////////////////
//////////////////// MAIN FUNCTIONS //////////////////////////
//////////////////////////////////////////////////////////////

// use to build book pages
function buildBook(id, series, title) {
  $.getJSON("/books/books.json", function (json) {
    // pull out the relevent book data
    let seriesNum = findSeriesNum(json, series);
    if (seriesNum === -1) {
      $(id).html("<h1> BOOK INFO NOT FOUND </h1>");
      return;
    }
    let titleNum = findTitleNum(json.seriesList[seriesNum], title);
    if (titleNum === -1) {
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
    $("<strong>").addClass("preblurb").text(data.preBlurb).appendTo($bookInfo);

    // add the description
    generateDescription(data, $bookInfo);

    //////////////////////////////////////////////////
    //// links to the rest of the series /////////////
    //////////////////////////////////////////////////
    tryMakingSeriesLinks(json.seriesList[seriesNum].bookList, titleNum, id);

    //////////////////////////////////////////////////
    //// the book purchase link section //////////////
    //////////////////////////////////////////////////

    // padding
    $("<br>").appendTo(id);

    // create the container
    let $buyContainer = $("<div>").addClass("buy-section-container");
    $buyContainer.appendTo(id);

    // create the section
    let $buySection = $("<div>").addClass("buy-section");
    $buySection.appendTo($buyContainer);

    $("<h1>").text("Purchase Links for This Book").appendTo($buySection);

    // create the purchase link list
    let $buyList = $("<ul>").addClass("buy-list");
    $buyList.appendTo($buySection);

    tryMakingLink(data, $buyList, "amazon", "Amazon");
    tryMakingLink(data, $buyList, "bn", "Barnes&Noble");
    tryMakingLink(data, $buyList, "bam", "Books-A-Million");
    tryMakingLink(data, $buyList, "indie", "IndieBound");
    tryMakingLink(data, $buyList, "kobo", "Kobo");
  });
}

// use to build the home page
function setupHome(id, series, title) {
  $.getJSON("/books/books.json", function (json) {
    // pull out the relevent book data
    let seriesNum = findSeriesNum(json, series);
    if (seriesNum === -1) {
      $(id).html("<h1> BOOK INFO NOT FOUND </h1>");
      return;
    }
    let titleNum = findTitleNum(json.seriesList[seriesNum], title);
    if (titleNum === -1) {
      $(id).html("<h1> BOOK INFO NOT FOUND </h1>");
      return;
    }
    let data = json.seriesList[seriesNum].bookList[titleNum];

    //////////////////////////////////////////////////
    ///////// configure the section //////////////////
    //////////////////////////////////////////////////

    // add image and title in this h1
    createTitle(data, id, true, "book-title", "main-book-img");

    // add tag line
    addTagLine(data, id);

    // add the quickblurb
    addQuickBlurb(data, id);

    // add "read more" link
    addReadMore(data, id);
  });
}

// use to build the standard book list page
function setupBookList(id, series) {
  $.getJSON("/books/books.json", function (json) {
    // pull out the relevent series data
    let seriesNum = findSeriesNum(json, series);
    if (seriesNum === -1) {
      $(id).html("<h1> SERIES INFO NOT FOUND </h1>");
      return;
    }

    let data = json.seriesList[seriesNum];

    //////////////////////////////////////////////////
    ///// loop over all books in series //////////////
    //////////////////////////////////////////////////

    for (var i = 0; i < data.bookList.length; i++) {
      let bookData = data.bookList[i];
      let $div = $("<div>").addClass("book-info");
      $div.appendTo(id);

      // add image and title in this h1
      createTitle(bookData, $div, true, "book-title", "book-img");

      // add tag line
      addTagLine(bookData, $div);

      // add the quickblurb
      addQuickBlurb(bookData, $div);

      // add "read more" link
      addReadMore(bookData, $div);

      // add separator
      if (i !== data.bookList.length - 1) {
        $("<hr>").appendTo(id);
      }
    }
  });
}

// use to build the alternating book list page
function setupBookListAlt(id, series) {
  $.getJSON("/books/books.json", function (json) {
    // pull out the relevent series data
    let seriesNum = findSeriesNum(json, series);
    if (seriesNum === -1) {
      $(id).html("<h1> SERIES INFO NOT FOUND </h1>");
      return;
    }

    let data = json.seriesList[seriesNum];

    //////////////////////////////////////////////////
    ///// loop over all books in series //////////////
    //////////////////////////////////////////////////

    for (var i = 0; i < data.bookList.length; i++) {
      let bookData = data.bookList[i];
      let $div = $("<div>").addClass("book-info");
      $div.appendTo(id);

      // add image and title in this h1
      if (i % 2) {
        // create reverse listing
        createTitle(bookData, $div, true, "book-title", "book-list-img-rev");
      } else {
        // create standard listing
        createTitle(bookData, $div, true, "book-title", "book-list-img");
      }

      // add tag line
      addTagLine(bookData, $div);
      // add the quickblurb
      addQuickBlurb(bookData, $div);
      // add "read more" link
      addReadMore(bookData, $div);

      // add separator
      if (i !== data.bookList.length - 1) {
        $("<hr>").appendTo(id);
      }
    }
  });
}
//////////////////////////////////////////////////////////////
////////////////// HELPER FUNCTIONS //////////////////////////
//////////////////////////////////////////////////////////////
// find series number from series name
function findSeriesNum(data, name) {
  for (var i = 0; i < data.seriesList.length; i++) {
    if (data.seriesList[i].title === name) {
      return i;
    }
  }
  return -1;
}

// find book number from series name
function findTitleNum(data, name) {
  for (var i = 0; i < data.bookList.length; i++) {
    if (data.bookList[i].title === name) {
      return i;
    }
  }
  return -1;
}

// create a title with an image next to it
function createTitle(data, where, flat, titleClass, imageClass) {
  let $bookTitle = $("<h1>")
    .addClass(titleClass)
    .text(data.title)
    .css("color", data.titleColor)
    .css("text-shadow", "0px 0px 4px " + data.titleShadow);
  let $img = $("<img>")
    .addClass(imageClass)
    .attr("src", "/img/" + (flat ? data.imageFileFlat : data.imageFile3D));

  // add a border if it is a flat image
  if (flat) {
    $img.css("border-color", data.borderColor);
  }
  $img.appendTo($bookTitle);
  $bookTitle.appendTo(where);
}

// add a tag line
function addTagLine(data, where) {
  $("<p>")
    .addClass("book-tagline")
    .text("- " + data.tagLine + " -")
    .appendTo(where);
}

// generate the book description section
function generateDescription(data, where) {
  let sections = data.fullBlurb.length;

  let $base = $("<p>").addClass("description-text");
  for (var i = 0; i < sections; i++) {
    $("<p>").text(data.fullBlurb[i]).appendTo($base);
  }
  $base.appendTo(where);
}

// attempt to make links to the rest of a series (do nothing if only one book in series)
function tryMakingSeriesLinks(bookList, titleNum, where) {
  if (bookList.length > 1) {
    $("<hr>").addClass("series-hr").appendTo(where);

    let seriesContainer = $("<div>").addClass("series-link-container");
    seriesContainer.appendTo(where);
    $("<p>")
      .addClass("series-link-header")
      .text("Also in this series")
      .appendTo(seriesContainer);

    let seriesSection = $("<div>").addClass("series-link-section");
    seriesSection.appendTo(seriesContainer);
    for (let i = 0; i < bookList.length; i++) {
      if (i !== titleNum) {
        makeSeriesLink(bookList[i], i, seriesSection);
      }
    }
  }
}

// add in a link to another book in a series
function makeSeriesLink(data, number, where) {
  $("<a>")
    .attr("href", "/books/" + data.htmlFile)
    .addClass("series-link")
    .html(
      "<img src=/img/" +
        data.imageFileFlat +
        ">" +
        '<p class="book-number"> Book ' +
        (number + 1) +
        "</p>"
    )
    .appendTo(where);
}

// attempt to make a purchase link (do nothing if it fails)
function tryMakingLink(data, where, abbrev, text) {
  let key = abbrev + "Link";
  if (data[key]) {
    let $li = $("<li>")
      .addClass("buy-list-item")
      .addClass("buy-list-" + abbrev);
    $li.appendTo(where);
    $("<a>").attr("href", data[key]).text(text).appendTo($li);
  }
}

// create a quick blurb
function addQuickBlurb(data, where) {
  $("<p>").addClass("description-text").text(data.quickBlurb).appendTo(where);
}

// create a "read more" link
function addReadMore(data, where) {
  let $p = $("<p>");
  $p.appendTo(where);
  $("<a>")
    .attr("href", "/books/" + data.htmlFile)
    .addClass("read-more-link")
    .text("READ MORE")
    .appendTo($p);
}
