"use strict";
let searchedBooks = {
	allBooks : [],
	keptBookIndices : []
}

let bookIndex = 0;
var searchedOnce = 1;



/* Called when the user pushes the "submit" button */
/* Sends a request to the API using the JSONp protocol */
function newRequest()
{
	let title = document.getElementById("title-input").value;
	title = title.trim();
	title = title.replace(" ","+");

	let author = document.getElementById("author-input").value;
	author = author.trim();
	author = author.replace(" ","+");

	let isbn = document.getElementById("isbn-input").value;
	isbn = isbn.trim();
	isbn = isbn.replace("-","");

	// Connects possible query parts with pluses
	let query = ["",title,author,isbn].reduce(fancyJoin);

	// The JSONp part.  Query is executed by appending a request for a new
	// Javascript library to the DOM.  Its URL is the URL for the query. 
	// The library returned just calls the callback function we specify, with
	// the JSON data we want as an argument. 
	if (query != "")
	{
		// remove old script
		let oldScript = document.getElementById("jsonpCall");
		if (oldScript != null) {
			document.body.removeChild(oldScript);
		}
		// make a new script element
		let script = document.createElement('script');

		// build up complicated request URL
		let beginning = "https://www.googleapis.com/books/v1/volumes?q=";
		let callback = "&callback=handleResponse";

		script.src = beginning+query+callback;
		script.id = "jsonpCall";

		// put new script into DOM at bottom of body
		document.body.appendChild(script);	
	}
}


/* Used above, for joining possibly empty strings with pluses */
function fancyJoin ( a, b )
{
    if (a == "") { return b; }	
    else if (b == "") { return a; }
    else { return a+"+"+b; }
}

function nextBook( leftOrRight )
{
	switch ( leftOrRight.toLowerCase() )
	{
		case 'right':
			//handleResponse already deals with case where we start at
				//bookIndex == last index

			bookIndex++;
			
			if ( bookIndex == searchedBooks.allBooks.length-1 )
			//if we moved into the last element
			{
				//hide right button
				document.querySelector(
					'#book-found-popup .right-arrow-button'
				).style.visibility = 'hidden';
			}
			if ( bookIndex == 1 )
			//if we moved out of first element
			{
				//reveal left button
				document.querySelector(
					'#book-found-popup .left-arrow-button'
				).style.visibility = 'visible';
			}
			break;
		case 'left':
			bookIndex--;

			if ( bookIndex == 0 )
			//if we moved into the first element
			{
				//hide left button
				document.querySelector(
					'#book-found-popup .left-arrow-button'
				).style.visibility = 'hidden';
			}
			if ( bookIndex == searchedBooks.allBooks.length-2 )
			//if we moved out of last element
			{
				//reveal right button
				document.querySelector(
					'#book-found-popup .right-arrow-button'
				).style.visibility = 'visible';
			}
			break;
		default:
			throw "invalid parameters for nextBook(...)";
	}

	if ( searchedBooks.keptBookIndices.includes( bookIndex ) )
	//if user already kept this book
	{
		//don't allow them to keep it again
		document.querySelector(
			'#keep-button'
		).style.visibility = 'hidden';
	}
	else
	{
		//reset keep button
		document.querySelector(
			'#keep-button'
		).style.visibility = 'visible';
	}

	//update overlay
	handleResponse();
}

/* The callback function, which gets run when the API returns the result of our query */
/* Replace with your code! */
function handleResponse( bookListObj )
{
	//if searched once at least, change the header to be smaller and the book list to pop up 
	var bookClubHeaderShrink = document.querySelector(
		".title"
	)
	var searchContainer = document.querySelector(
		"#container-above-search-form"
	);

	//set header of window is mobile view size
	if(window.innerWidth <= 480 && searchedOnce <=1){
		let searchIcon = document.createElement("i");
		searchIcon.classList.add("fas");
		searchIcon.classList.add("fa-search");
		searchIcon.setAttribute("id", "search-icon");
		searchIcon.style.display = "inline-block";
		searchIcon.style.float = "right";
		searchIcon.style.marginLeft = "20px";
		searchIcon.addEventListener("click", mobileSearchView)
		searchContainer.style.display = "none";
		bookClubHeaderShrink.appendChild(searchIcon);
		searchedOnce +=1;
	}

	//set header if window is larger than mobile view size
	if(window.innerWidth > 480){
		let searchIcon = document.createElement("i");
		searchIcon.style.display = "none";
	}


	if ( bookListObj !== undefined )
	//this is the initial api call
	{
		bookIndex = 0;//we're starting with book 0

		if(bookListObj.totalItems === 0)
		{
			bookNotFound();
			return;
		}

		//Save book array
		searchedBooks.allBooks = bookListObj.items;
		//reset keep button
		document.querySelector(
			'#keep-button'
		).style.visibility = 'visible';

		//we're starting with left-most book
		document.querySelector(
			'#book-found-popup .left-arrow-button'
		).style.visibility = 'hidden';

		if ( searchedBooks.allBooks.length == 1 )
		//if we're also at the right-most book
		{
			document.querySelector(
				'#book-found-popup .right-arrow-button'
			).style.visibility = 'hidden';
		}
		else
		{
			//reset button
			document.querySelector(
				'#book-found-popup .right-arrow-button'
			).style.visibility = 'visible';
		}
	}
	//else this is not the first time this function has been called

	fillTile( 'book-found-popup' );

	//display overlay
	let overlayDisplay = document.getElementById("overlay");
	overlayDisplay.style.display = "flex";

	document.querySelector(
		'#book-found-popup'
	).style.display = 'flex';
}

function keepBook()
{
	if ( keepBook.uniqueTileNumber === undefined )
	{
		keepBook.uniqueTileNumber = 0;
	}
	else
	{
		keepBook.uniqueTileNumber++;
	}

	//work off tile template
	let newTile = document.querySelector(
		'#template-tile'
	).cloneNode( true );//true for deep copy of children

	//new identifiers
	newTile.classList.remove( 'template' );
	newTile.id = 'tile' + keepBook.uniqueTileNumber;

	//move tile into DOM
	document.querySelector(
		'#bookDisplay'
	).appendChild( newTile );

	//fill with book details
	fillTile( newTile.id );

	//template doesn't have x-button, so we add it
	newTile.onclick =
		() => {
			removeTile( newTile.id );
		};

	//display new tile
	newTile.style.visibility = 'visible';

	//do not let user keep book again
	document.querySelector(
		'#keep-button'
	).style.visibility = 'hidden';
	//record that this book has already been kept
	searchedBooks.keptBookIndices.push( bookIndex );

	closeOverlay();
}

function removeTile( tileId )
{
	document.querySelector(
		'#bookDisplay'
	).removeChild(
		document.getElementById(
			tileId
		)
	);
}

function fillTile( tileContainerId )
{
	let tileIdSelector = '#' + tileContainerId;
		//tileContainerId should only contain 1 tile

	//save book
	let book = searchedBooks.allBooks[ bookIndex ];
	
	//Remove old elements
	document.querySelector(//get parent
		tileIdSelector + ' .container-above-book-cover'
	).removeChild(//remove child of parent
		document.querySelector(
			tileIdSelector + ' .book-cover'//remove img
		)
	);
	document.querySelector(//get parent
		tileIdSelector + ' .book-details'
	).removeChild(//remove child of parent
		document.querySelector(
			tileIdSelector + ' .book-title'//remove title
		)
	);
	document.querySelector(//get parent
		tileIdSelector + ' .book-details'
	).removeChild(//remove child of parent
		document.querySelector(
			tileIdSelector + ' .book-author'//remove author
		)
	);
	document.querySelector(//get parent
		tileIdSelector + ' .book-details'
	).removeChild(//remove child of parent
		document.querySelector(
			tileIdSelector + ' .book-description'//remove desc
		)
	);

	//Create new elements
	let img_elem = document.createElement("img");
	let title_elem = document.createElement("H1");
	let author_elem = document.createElement("H2");
	let desc_elem = document.createElement("p");//description
	
	//Gather strings from current book
	let title_str = book.volumeInfo.title;
	let img_link;
	if ( book.volumeInfo.imageLinks !== undefined )
	//if there is not cover
	{
		if ( book.volumeInfo.imageLinks.thumbnail !== undefined )
		{
			img_link = book.volumeInfo.imageLinks.thumbnail;
		}
		else if ( book.volumeInfo.imageLinks.smallThumbnail !== undefined )
		{
			img_link = book.volumeInfo.imageLinks.smallThumbnail;
		}
	}
	else
	{
		img_link = 'noCover.jpg';
	}
	let desc_str;
	if ( book.volumeInfo.description !== undefined )
	{
		desc_str = book.volumeInfo.description;
	}
	else
	{
		desc_str = "( no description )";
	}

	let author_str = "by ";//there may be multiple authors
	//Gather all authors
	if ( book.volumeInfo.authors !== undefined )
	{
		for ( let i = 0; i < book.volumeInfo.authors.length; i++ )
		{
			author_str += book.volumeInfo.authors[i];
			
			if ( book.volumeInfo.authors[i+1] )
			{
				author_str += ", ";
			}
		}
	}
	else
	{
		author_str = "( no author )";
	}

	//Select container to hold new elements
	let bookCoverContainer =
		document.querySelector(
			tileIdSelector + ' .container-above-book-cover'
		);
	let bookDetailsContainer =
		document.querySelector(
			tileIdSelector + ' .book-details'
		);

	//Create text nodes
	let title_textNode = document.createTextNode(title_str);
	let author_textNode = document.createTextNode(author_str);
	
	//Enforce 30-word maximum for descriptions
	let desc_wordArray = desc_str.split(" ");
	desc_str = "";
	for ( let i = 0; i < desc_wordArray.length; i++ )
	{
		desc_str += desc_wordArray[i] + " ";

		if ( i === 29 )
		{
			desc_str += "...";
			break;
		}
	}
	let desc_textNode = document.createTextNode( desc_str );


	img_elem.src = img_link;
	title_elem.appendChild(title_textNode);
	author_elem.appendChild(author_textNode);
	desc_elem.appendChild(desc_textNode);


	img_elem.classList.add("book-cover");
	title_elem.classList.add("book-title");
	title_elem.classList.add("text");
	author_elem.classList.add("book-author");
	author_elem.classList.add("text");
	desc_elem.classList.add("book-description");
	desc_elem.classList.add("text");

	//fill tile
	bookCoverContainer.appendChild(img_elem);
	bookDetailsContainer.appendChild(title_elem);
	bookDetailsContainer.appendChild(author_elem);
	bookDetailsContainer.appendChild(desc_elem);
}

function mobileSearchView(){
	var searchContainer = document.querySelector(
		"#container-above-search-form"
	);
	searchContainer.style.display = "flex";
}
function closeOverlay()
{
	//reset values
	searchedBooks.keptBookIndices = [];
	searchedBooks.allBooks = [];

	document.querySelector(
		'#overlay'
	).style.display = 'none';
}

function bookNotFound()
{
	//display overlay
	document.getElementById("overlay")
		.style.display = "flex";

	//make sure that #book-found-popup is hidden
	document.getElementById("book-found-popup")
		.style.display = "none";

	//display the #book-not-found-popup
	let notFoundPopup = document.getElementById("book-not-found-popup");
	notFoundPopup.style.display = "flex";

	//make sure that close button is ready
	let closeButton = document.getElementById("not-found-ok-button");
	closeButton.addEventListener("click", closeOverlay);

	let oldMessage
	if ( oldMessage = document.querySelector('#not-found-message') )
	{
		notFoundPopup.removeChild( oldMessage );
	}

	notFoundPopup.insertBefore(
		notFoundMessage(),
		closeButton
	);

	return;
}


function notFoundMessage()
{
	let title = document.getElementById("title-input").value;
	title = title.trim();
	title =
		( title == "" ) ? null : title;

	let author = document.getElementById("author-input").value;
	author = author.trim();
	author =
		( author == "" ) ? null : author;

	let isbn = document.getElementById("isbn-input").value;
	isbn = isbn.trim();
	isbn =
		( isbn == "" ) ? null : isbn;

	let message = document.createElement("p");

	//identifiers
	message.id = 'not-found-message';
	message.classList.add( "text" );

	//'The book '
	message.appendChild(
		document.createTextNode( 'The book ' )
	);

	//[<book title>]
	if ( title !== null )
	{
		message.appendChild(
			createInputElement(
				title + ' ',
				'title'
			)
		);
	}

	//['by author '<author>' ']
	if ( author !== null )
	{
		message.appendChild(
			document.createTextNode(
				'by author '
			)
		);
		message.appendChild(
			createInputElement(
				author + ' ',
				'author'
			)
		);
	}

	//['with isbn '<isbn>' ']
	if ( isbn !== null )
	{
		message.appendChild(
			document.createTextNode(
				'with isbn '
			)
		);
		message.appendChild(
			createInputElement(
				isbn + ' ',
				'isbn'
			)
		);
	}

	//'could not be found'
	message.appendChild(
		document.createTextNode(
			'could not be found.'
		)
	);

	message.appendChild(
		document.createElement('br')
	);

	message.appendChild(
		document.createTextNode(
			'Try another search!'
		)
	);

	return message;

	function createInputElement( input_value, input_typeStr )
	{
		//create bold element
		let input_elem = document.createElement('b');

		//display what the user entered
		input_elem.appendChild(
			document.createTextNode( input_value )
		);

		//identifiers
		input_elem.classList.add(
			'text'
		);
		input_elem.id = 'not-found-' + input_typeStr;

		return input_elem;
	}
}
