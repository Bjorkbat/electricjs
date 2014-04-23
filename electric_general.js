/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function Resistor(x, y, r, context) {

  var Img_0 = new Image();
  Img_0.src = "/static/" + r + "_resistor.png";
  Img_0.onload = function() { context.drawImage(Img_0, x, y); };

  var Img_90 = new Image();
  Img_90.src = "/static/" + r + "_resistor_90.png";

  var Img_180 = new Image();
  Img_180.src = "/static/" + r + "_resistor_180.png";

  var Img_270 = new Image();
  Img_270.src = "/static/" + r + "_resistor_270.png";

  this.xPos = x || 0;
  this.yPos = y || 0;

  this.width = 40;
  this.height = 40;

  this.resistance = r;
  this.summedResist = r;

  this.seriesSum = [this];
  this.future_series_sum = [this];

  this.inputTerm = new Terminal(x, y + 20, this, "Neutral");
  this.outputTerm = new Terminal(x + 40, y + 20, this, "Neutral");

  console.log("This is the effective resistance:  " + this.effective_resistance);

  this.type = "resistor";
  this.name = this.resistance + " Ohm Resistor";

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

  this.rotate_clockwise = function() {
    this.steps = (this.steps + 1) % 4;
    switch (this.steps) {
      case 0:
	      this.inputTerm.setX(this.xPos);
	      this.inputTerm.setY(this.yPos + 20);

	      this.outputTerm.setX(this.xPos + 40);
	      this.outputTerm.setY(this.yPos + 20);
	      break;
      case 1:
	      this.inputTerm.setX(this.xPos + 20);
	      this.inputTerm.setY(this.yPos);

	      this.outputTerm.setX(this.xPos + 20);
	      this.outputTerm.setY(this.yPos + 40);
	      break;
      case 2:
	      this.inputTerm.setX(this.xPos + 40);
	      this.inputTerm.setY(this.yPos + 20);

	      this.outputTerm.setX(this.xPos);
	      this.outputTerm.setY(this.yPos + 20);
	      break;
      case 3:
	      this.inputTerm.setX(this.xPos + 20);
	      this.inputTerm.setY(this.yPos + 40);

	      this.outputTerm.setX(this.xPos + 20);
	      this.outputTerm.setY(this.yPos);
	      break;
    }
  };
}

Resistor.prototype = new Component();



function LED(x, y, color, context) {

  var Img_0 = new Image();
  Img_0.src = "/static/" + color.toLowerCase() + "led.png";
  Img_0.onload = function() { context.drawImage(Img_0, x, y); };

  var Img_90 = new Image();
  Img_90.src = "/static/" + color.toLowerCase() + "led_90.png";

  var Img_180 = new Image();
  Img_180.src = "/static/" + color.toLowerCase() + "led_180.png";

  var Img_270 = new Image();
  Img_270.src = "/static/" + color.toLowerCase() + "led_270.png";

  this.xPos = x || 0;
  this.yPos = y || 0;

  this.width = 30;
  this.height = 70;

  this.type = "LED";
  this.color = color;
  this.name = color.charAt(0).toUpperCase() + color.slice(1) + " LED";

  this.inputTerm = new Terminal(x + 10, y + 70, this, "Positive");
  this.outputTerm = new Terminal(x + 20, y + 60, this, "Negative");

  this.seriesSum = [this];
  this.future_series_sum = [this];

  this.voltage = 2.2;
  this.resistance = 0;


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

  this.rotate_clockwise = function() {
    this.steps = (this.steps + 1) % 4;
  };
}

LED.prototype = new Component();