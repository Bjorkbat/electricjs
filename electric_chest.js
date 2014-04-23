
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/******************************************************************************
*
*	Set of functions for dealing with the special "chest" feature of the
* breadboard
*
******************************************************************************/

/* Quite certain that the eval statements in this javascript is quite alright*/
/* jshint evil:true*/

var makeButton = function(chest) {

	var exitButtonRow = document.createElement("div");
	exitButtonRow.setAttribute('class', "row");
	chest.appendChild(exitButtonRow);

	var exitButtonCol = document.createElement("div");
	exitButtonCol.setAttribute('class', "col-lg-12");
	exitButtonRow.appendChild(exitButtonCol);

	var exitButton = document.createElement("button");
	exitButton.type = "button";
	exitButton.setAttribute('class', "btn btn-default pull-right");
	exitButton.innerHTML = "Close Chest";
	exitButton.onclick = function() {
		$("#chest").empty();
		$("#chest").remove();
		state.setOpening(false);
	};
	exitButtonCol.appendChild(exitButton);

};

var open_chest = function() {
	//get the canvas and get its offset vals
	var canvas = document.getElementById("breadboard");
	var canvas_offset = $("#breadboard").offset();

	// Here we're setting the start position of the chest +50 and +80.
	// This effectively centers the chest, assuming it's 640 x 400, and assuming
	// the canvas is 500 x 800
	// Will change in future to make this part size agnostic.
	var total_top = canvas_offset.top;
	var total_left = canvas_offset.left;

	//create a new div, the "chest" and position it directly over canvas, but at
	//4/5ths the width of the canvas
	var chest = document.createElement("div");
	chest.setAttribute("id", "chest");
	chest.style.position = "absolute";
	chest.style.top = total_top + "px";
	chest.style.left = 90 + "px";
	chest.style.width = "640px";
	chest.style.height = "400px";
	chest.style.backgroundColor = "white";

	makeButton(chest);

	//finally, insert chest into the document
	var main = document.getElementById("breadGroup");
	main.appendChild(chest);

	$.get("/get_components/", "chest=open", function(data) {

		var icon;
		var icon_block;
		var img;
		var txt;
		//evaluate the JSON data
		data = (eval('(' + data + ')'));

		//create an icon_block element to hold the icons
		icon_block = document.createElement('div');
		icon_block.setAttribute('class', "row");
		chest.appendChild(icon_block);

		//for each data object, create an icon element and populate it with an image
		//and a short descriptor
		for(var i in data) {

			icon = document.createElement("div");
			icon.setAttribute('class', "col-lg-4");
			icon.setAttribute('onclick', "open_cat(this)");
			icon_block.appendChild(icon);

			img = document.createElement('img');
			img.setAttribute('src', data[i].fields.image);
			img.setAttribute('class', "center-block");
			icon.appendChild(img);

			txt = document.createElement('p');
			txt.innerHTML = data[i].fields.name;
			icon.appendChild(txt);

			if((i + 1) % 3 === 0) {
				icon_block = document.createElement("div");
				icon_block.setAttribute('class', "row");
				chest.appendChild(icon_block);
			}
		}
	});
};

var open_cat = function(icon_elem) {

	// i.e. the name of the category
	var category = icon_elem.lastChild.innerHTML;
	var chest = document.getElementById("chest");
	var icon;
	var icon_block;
	var img;
	var txt;

	$.get("/get_components/", "cat="+category, function(data) {
		$("#chest").empty();
		makeButton(chest);

		//grab the json data
		data = (eval('(' + data + ')'));
		//then grab the actual stuff we want, the fields of the different models

		icon_block = document.createElement('div');
		icon_block.setAttribute('class', "row");
		chest.appendChild(icon_block);

		for(var i in data) {
			icon = document.createElement('div');
			icon.setAttribute('class', "col-lg-4");
			// TO-DO: Define behavior for icons which are categories, and behavior
			// for icons which are components.
			// Currently assuming all categories lead to components.
			icon.setAttribute('onclick', "place_component(\x22" +
				data[i].fields.constructor_template + ';' + "\x22)");
			icon_block.appendChild(icon);

			img = document.createElement('img');
			img.setAttribute('src', data[i].fields.image);
			img.setAttribute('class', "center-block");
			icon.appendChild(img);

			txt = document.createElement('p');
			txt.innerHTML = data[i].fields.name;
			icon.appendChild(txt);

			if((i + 1) % 3 === 0) {
				icon_block = document.createElement("div");
				icon_block.setAttribute('class', "row");
				chest.appendChild(icon_block);
			}
		}
	});
};

var place_component = function(constructor) {
	var canvas = document.getElementById("breadboard");
	var component;
	context = canvas.getContext('2d');

	constructor = constructor.replace("x_val", canvas.width / 2);
	constructor = constructor.replace("y_val", canvas.height / 2);
	constructor = constructor.replace("ctx", "context");
	console.log(constructor);

	component = eval(constructor);
	state.addComponent(component);
	$("#chest").empty();
	$("#chest").remove();
	state.setOpening(false);
};