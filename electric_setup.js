/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//First things first, get our canvas element and the context

var canvas = document.getElementById("breadboard");
var context = canvas.getContext("2d");
var state = new canvasState(canvas);

var last_time = new Date().getTime();
var current_time;

var frame_rate;


/************************************************************
 *
 * Various variables that may be of use for event listeners
 *
 * **********************************************************/

//if drawing == true, then user is actually in the process
//of drawing a line
//NOT the same as the state.drawing attribute.  That merely says that the
//drawing button has been pressed
var drawing = false;

//used for the lines.  If you must know, they save the
//current x and y positions of the start and end of the line
var startX;
var startY;
var endX;
var endY;

var component;
var wire;

var terminalStart;
var branchStart;
var terminalEnd;
var branchEnd;

//Very useful, gets the mouse position relative to the canvas
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

//Event listener for when user presses mouse button, the left one obviously
canvas.onmousedown = function(evt) {
  mPos = getMousePos(canvas, evt);

  if(state.isOverButton(mPos.x, mPos.y, true)) {
    state.refresh();
  }
  else if(state.isOverComponent(mPos.x, mPos.y)) {
    // check to see if state is in default status or rotating status
    // if default, gonna drag it
    // if rotating, call rotate_clockwise
    // if neither are true, do nothing
    component = state.isOverComponent(mPos.x, mPos.y);
    if(state.default)
      state.dragging = true;
    else if(state.rotating) {
      component.rotate_clockwise();
      state.refresh();
    }
  }
  else {
    //see if you're drawing something, if you are, then do appropriate stuff
    //also, see if you're erasing something
    //if neither, then do nothing
    if(state.drawing) {
      if(!drawing) {
				branchStart = state.isOverBranch(mPos.x, mPos.y);
				if(!branchStart) { terminalStart = state.isOverTerminal(mPos.x, mPos.y); }

				if(mPos.x % 10 > 5) { startX = mPos.x + (10 - mPos.x % 10); }
				else { startX = mPos.x - mPos.x % 10; }
				if(mPos.y % 10 > 5) { startY = mPos.y + (10 - mPos.y % 10); }
				else { startY = mPos.y - mPos.y % 10; }

				wire = new Wire(startX, startY, startX, startY);
				drawing = true;
      }
      else {
				drawing = false;

				branchEnd = state.isOverBranch(mPos.x, mPos.y);
				if(!branchEnd) { terminalEnd = state.isOverTerminal(mPos.x, mPos.y); }

				if(mPos.x % 10 > 5) { endX = mPos.x + (10 - mPos.x % 10); }
				else { endX = mPos.x - mPos.x %10 ; }
				if(mPos.y % 10 > 5) { endY = mPos.y + (10 - mPos.y %10); }
				else { endY = mPos.y - mPos.y % 10; }
				wire.setEnd(endX, endY);

				if(branchStart) {
					console.log("branch append");
					wire.setStartObj(branchStart.terminal);
					branchStart.addConnect(wire);
				}
				else if(terminalStart) { wire.setStartObj(terminalStart); }
				if(branchEnd) {
					console.log("branch append");
					wire.setEndObj(branchEnd.terminal);
					branchEnd.addConnect(wire);
				}
				else if(terminalEnd) {wire.setEndObj(terminalEnd); }

				state.addWire(wire);
				state.refresh();
      }
    }
    else if(state.erasing) {
      wire = state.isOverWire(mPos.x, mPos.y);
      if(wire) { console.log(state.removeWire(wire)); }
      state.refresh();
    }
  }
};

/******************************************************************
 *
 * event listener for mouseup / when user lets go of mouse button
 *
 * ****************************************************************/

canvas.onmouseup = function(evt) {
  mPos = getMousePos(canvas, evt);

  var xval;
  var yval;
  if(state.dragging) {
    if(component) {
      xval = component.xPos;
      yval = component.yPos;
      // Reminder: keep the setX and setY methods
      // they do more than simply change the x and y positions
      if(xval % 10 > 5) { component.setCompX (xval + (10 - xval % 10)); }
      else { component.setCompX(xval - (xval % 10)); }
      if(yval % 10 > 5) { component.setCompY (yval + (10 - yval % 10)); }
      else { component.setCompY(yval - (yval % 10)); }
    }
    state.refresh();
    state.dragging = false;
  }
};

/************************************************************
 *
 * event listener for mouse movement / when user moves mouse
 *
 * **********************************************************/

canvas.onmousemove = function(evt) {
  mPos = getMousePos(canvas, evt);

  current_time = new Date().getTime();
  if(current_time - last_time >= 33) {
    state.refresh();
    frame_rate = 1000 / (current_time - last_time);
    last_time = current_time;
  }

  if(state.isOverButton(mPos.x, mPos.y, false)) {
    state.refresh();
  }
  //Note: this is essentially the same as saying the mouse is over a component
  else if(state.isOverComponent(mPos.x, mPos.y) || state.dragging) {
    //component = state.isOverComponent(mPos.x, mPos.y);
    if(state.dragging) {
      var xOff = state.xOffset;
      var yOff = state.yOffset;

      component.setCompX(mPos.x - xOff);
      component.setCompY(mPos.y - yOff);

      wire = component.getInputWire();
      terminalStart = component.inputTerm;
      terminalEnd = component.outputTerm;
      if(wire) {
				if(wire.startTerm == terminalStart)
					wire.setStart(terminalStart.xPos, terminalStart.yPos);
				else if(wire.endTerm == terminalStart)
					wire.setEnd(terminalStart.xPos, terminalStart.yPos);
      }
      wire = component.getOutputWire();
      if(wire) {
				if(wire.startTerm == terminalEnd)
					wire.setStart(terminalEnd.xPos, terminalEnd.yPos);
				else if(wire.endTerm == terminalStart)
					wire.setEnd(terminalEnd.xPos, terminalEnd.yPos);
      }
    }
  }
  else {
    if(state.drawing && !drawing) {
      state.refresh();
      state.isOverBranch(mPos.x, mPos.y);
      state.isOverTerminal(mPos.x, mPos.y);
    }
    else if(state.drawing && drawing) {
    	//be sure to snap the wire endpoint to the grid
			if(mPos.x % 10 > 5) { endX = mPos.x + (10 - mPos.x % 10); }
			else { endX = mPos.x - mPos.x %10 ; }
			if(mPos.y % 10 > 5) { endY = mPos.y + (10 - mPos.y %10); }
			else { endY = mPos.y - mPos.y % 10; }

			//then, refresh the canvas and draw the wire with these new endpoints
      state.refresh();
      wire.setEnd(endX, endY);
      wire.draw(context);
      state.isOverBranch(endX, endY);
      state.isOverTerminal(endX, endY);
    }
    else if(state.erasing) {
      state.isOverWire(mPos.x, mPos.y);
      state.refresh();
    }
  }
};