/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function Battery_9volt(x, y, context) {

  var Img_0 = new Image();
  Img_0.src = "/static/9v_battery.png";
  Img_0.onload = function() { context.drawImage(Img_0, x, y); };

  var Img_90 = new Image();
  Img_90.src = "/static/9v_battery_90.png";

  var Img_180 = new Image();
  Img_180.src = "/static/9v_battery_180.png";

  var Img_270 = new Image();
  Img_270.src = "/static/9v_battery_270.png";

  this.xPos = x || 0;
  this.yPos = y || 0;

  this.inputTerm = new Terminal(x + 20, y, this, "Positive");
  this.outputTerm = new Terminal(x + 60, y, this, "Negative");

  this.width = 80;
  this.height = 110;

  this.voltage = 9;

  this.type = "9 volt battery";
  this.name = "9 Volt Battery";

  this.draw = function(context) {
    //if(action && actionImg) { context.drawImage(actionImg, xPos, yPos); }
    if(this.on_off && this.onImg) { context.drawImage(onImg, this.xPos, this.yPos); }
    else {
      switch(this.steps) {
	case 0:
	  context.drawImage(Img_0, this.xPos, this.yPos);
	  break;
	case 1:
	  context.drawImage(Img_90, this.xPos, this.yPos);
	  break;
	case 2:
	  context.drawImage(Img_180, this.xPos, this.yPos);
	  break;
	case 3:
	  context.drawImage(Img_270, this.xPos, this.yPos);
	  break;
      }
    }

    if(this.display_flag) {
      context.font = '10pt Menlo';
      context.fillStyle = 'black';
      if(this.simulate_flag) {
	context.fillText("Voltage: " + this.voltage.toFixed(2) + "Volts", this.xPos - 50, this.yPos);
	context.fillText("Current: " + (this.current * 1000).toFixed() + " mA", this.xPos - 50, this.yPos - 10);
      }
      else {
	context.fillText("Component Type: " + this.name, this.xPos - 50, this.yPos);
      }
    }
  };

  //          //
  // Mutators //
  //          //

  this.rotate_clockwise = function() {
    this.steps = (this.steps + 1) % 4;
    switch (this.steps) {
      case 0:
	this.inputTerm.setX(x + 20);
	this.inputTerm.setY(y);

	this.outputTerm.setX(x + 60);
	this.outputTerm.setY(y);

	this.height = 110;
	break;
      case 1:
	this.inputTerm.setX(x + 80);
	this.inputTerm.setY(y + 20);

	this.outputTerm.setX(x + 80);
	this.outputTerm.setY(y + 50);

	this.height = 70;
	break;
      case 2:
	this.inputTerm.setX(x + 20);
	this.inputTerm.setY(y + 110);

	this.outputTerm.setX(x + 60);
	this.outputTerm.setY(y + 110);

	this.height = 110;
	break;
      case 3:
	this.inputTerm.setX(x);
	this.inputTerm.setY(y + 50);

	this.outputTerm.setX(x);
	this.outputTerm.setY(y + 20);

	this.height = 70;
	break;
    }
  };

}

Battery_9volt.prototype = new Component();
