/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/******************************************************************************
*
*	setup_grid
*
* Unlike the "classes" below, this is tended to act as a function.  It also
* isn't called by the state class or interacted with it at any point
*
* PARAM context: the context of the canvas
* PARAM highlights: the points on the grid that you wish to "highlight" by
* replacing the usual grey plus sign with a more noticeable blue one.  Used
* to prod users into designing circuits with wires arranged in a certain way
*
******************************************************************************/
var setup_grid = function(context, highlights) {
  
  context.beginPath();
  context.strokeStyle = "#CCCCCC";
  var style_flag = false;
  
  // counter variables
  var x = 0;
  var y = 0;
  var h = 0;
  
  //The logic behind using floats is complicated, just roll with it.
  //Also, starting at 7.75 because that's the axis we're drawing on.  
  for (x = 10.5; x < 800; x += 10) {
    for(y = 7.75; y < 500; y += 10) {
    	
    	//In a nutshell, if x and y, when adjusted, match the highlight x and y
    	//call stroke so you can change the style, add text, set a flag, and
    	//begin the path anew with this new style
      for(h in highlights) {
        if(x - 0.5 == highlights[h].x && y + 2.25 == highlights[h].y) {
          context.stroke();
          context.strokeStyle = "red";
					context.font = "8pt Menlo";
					context.fillText(h, x, y);
          style_flag = true;
          context.beginPath();
          break;
        }
      }
			
			//This is the part that actually draws the line
			//here we're drawing parallel to y-axis, with a line length of 5
      context.moveTo(x, y);
      context.lineTo(x, y+5);

      if(style_flag) {
        context.stroke();
        context.beginPath();
        context.strokeStyle = "#CCCCCC";
        style_flag = false;
      }
    }
  }

	//Now we're drawing lines parallel to the x-axis, using same process as before.
  for (y = 10.5; y < 500; y += 10) {
    for(x = 7.75; x < 800; x += 10) {

      for(h in highlights) {
        if(x + 2.25 == highlights[h].x && y - 0.5 == highlights[h].y) {
          context.stroke();
          context.strokeStyle = "red";
          style_flag = true;
          context.beginPath();
          break;
        }
      }

      context.moveTo(x, y);
      context.lineTo(x+5, y);
      
      if(style_flag) {
        context.stroke();
        context.beginPath();
        context.strokeStyle = "#CCCCCC";
        style_flag = false;
      }
    }
  }
  context.stroke();
};

/*****************************************************************************
 * 
 * Support Function.  A way to determine if two arrays basically have the same
 * content, and thus are equal in a certain sense.  Also used to determine if
 * CompCluster objects have the same cluster entities (thus implying that
 * they're intended to be equal)
 * 
 * **************************************************************************/
equal_array = function(s1, s2) {
  
  var unique = true;
  
  if(s1.length == s2.length) {
    for(var i in s1) {
      unique = true;
      for(var o in s2) {
				if(s1[i] == s2[o])
				  unique = false;
			}
      if(unique === true)
      	break;
    }
  }
  
  return !unique;
};

/******************************************************************************
*
* Component
* An object used to represent, well, a component.  At the moment, it's only
* intended to represent simple components with two terminals, may change.
* Numerous other objects inherit from Component
*
* PARAM x: Simple enough, the x starting x coordinate of the component
* PARAM y: Same as x, only, you know, the y coordinate instead
* PARAM w: This time, we're talking about the width of the component.  This
* can in fact actually change
* PARAM h: Obvious enough, the height of the component
* PARAM src: The path to the image used to represent the component, its
* graphical avatar so-to-speak
* PARAM context: The context of the canvas that the component will be drawn on
*
******************************************************************************/
function Component(x, y, w, h, src, context) {
  
  var Img_0 = new Image();
  Img_0.src = src || "";
  Img_0.onload = function() { context.drawImage(Img_0, x, y); };
  
  this.xPos = x;
  this.yPos = y;
  
  this.width = w;
  this.height = h;
  
  //As in rotation steps
  this.steps = 0;
  
  //Resistor?  LED?  Battery?  See component libraries for details
  this.type = null;
  
  //The terminal object representing the input, the components directly
  //connected to this component, and soon to be input components, in
  //that order.
  //Will explain role of future_inputComps at a later date
  this.inputTerm = null;
  this.inputComps = null;
  this.future_inputComps = null;
  
  //See above
  this.outputTerm = null;
  this.outputComps = null;
  this.future_outputComps = null;
  
  //used for power and ground purposes
  this.visited = false;
    
  this.voltage = 0;
  this.current = 0;
  this.resistance = 0;
  this.summedResist = 0;
  this.future_effective = 0;
  
  this.seriesSum = [this];
  console.log(this.seriesSum[0]);
  this.future_series_sum = [this];
  this.parallel_cluster = [];
  this.parallelSeriesSum = [this];
  this.cluster_update = false;
  this.mergedInputs = 1;
  this.mergedOutputs = 1;
  this.series_update = false;
  this.entity_of = null;
  
  //if the component does something, we use this.
  this.action = null;
  this.actionImg = null;
  
  this.on_off = null;
  this.display_flag = false;
  this.simulate_flag = false;
  this.shorted_flag = false;
  
  var onImg = null;
  
  //Look at isPowered and isGrounded for details
  this.switched = false;
  
  //Called when canvas is refreshed.  Basically, it draws the image, and if
  //the mouse cursor is over the component, then it displays info depending
  //on whether sim is in simulation mode or build mode
  this.draw = function(context) {
    if(this.on_off && this.onImg) { context.drawImage(onImg, this.xPos, this.yPos); }
    else { context.drawImage(Img_0, this.xPos, this.yPos); }
    
    if(this.display_flag) {
      context.font = '10pt Menlo';
      context.fillStyle = 'black';
      if(this.simulate_flag) {
				context.fillText("Voltage: " + this.voltage.toFixed(2) + "Volts", this.xPos - 50, this.yPos);
				context.fillText("Current: " + (this.current * 1000).toFixed() + " mA", this.xPos - 50, this.yPos - 10);
      }
      else {
				context.fillText("Component Type: " + this.type, this.xPos - 50, this.yPos);
      }
    }	
  };
  
  /****************************************************************************
  *
  * Accessors
  * In all future cases where you see accessors for other classes, assume that
  * the accessors are basically convenient shortcuts for when simply
  * accessing the attributes of an object are inconvient, for whatever reason
  *
  ****************************************************************************/
  
  this.getInputWire = function() { return this.inputTerm.connectedTo; };
  
  this.getOutputWire = function() { return this.outputTerm.connectedTo; };
        
  //Don't let the length of the method fool you, all isPowered does is tell you if
  //the component is connected to a power source from the positive terminal.
  //Unfortunately, that requires traversing through all the components its
  //connected to from the input side, until eventually finding a power source
  //or not.
  this.isPowered = function() {
  	    
    var has_battery = false;
    var switch_buffer;
    this.visited = true;
    
    // counter variables
    // for the sake of semantics, or whatever, i is used for inputComps, and o
    // is used for outputComps
    var i = 0;
    
    //If we're lucky, component might be connected directly to a power source,
    //or one of its inputs might have already been visited and switched to "on"
    //(as in, we called this and the Grounded method on it already, and it
    //satisfies both conditions
    for(i = 0; i < this.inputComps.length; i ++) {
      if(this.inputComps[i].type === "9 volt battery" || this.inputComps[i].on_off)
			has_battery = true;
    }
    
    //If we're not that lucky, then take the components inputComps, and if
    //They haven't been visited yet, call this method on them, recursively
    //going through until either one of them satisfies the method, or we
    //run out of inputs
    if(!has_battery) {
      for(i = 0; i < this.inputComps.length; i ++) {
				if(!this.inputComps[i].visited) {
					has_battery = this.inputComps[i].isPowered();
					if(has_battery)
						break;
				}
      }
      //If that didn't work, then lets try the method on the outputs.
      //Basically, we're going to try and see the component was wired
      //incorrectly.
      //Note, we're checking to see if the outputComp is a battery first
      //Before trying the recursive method again
      if(!has_battery) {
				for(o = 0; o < this.outputComps.length; o ++) {
					if(this.outputComps[o].type === "9 volt battery") {
						has_battery = true;
						break;
					}
				}
				if(!has_battery) {
					for(o = 0; o < this.outputComps.length; o ++) {
						if(!this.outputComps[o].visited) {
							has_battery = this.outputComps[o].isPowered(this);
							break;
						}
					}
				}
				//If the component is connected to a battery through its outputs, then
				//switch the inputs and outputs around
				if(has_battery) {
					switch_buffer = this.outputComps.slice(0);
					this.outputComps = this.inputComps.slice(0);
					this.inputComps = switch_buffer.slice(0);
					console.log(this.outputComps);
					console.log(this.inputComps);
					this.switched = true;
				}
			}
		}
		this.visited = false;
		return has_battery;
  };
  
  //See above comment block on the isPowered method
  this.isGrounded = function(prev_component) {
    
    var has_battery = false;
    var switch_buffer;
    this.visited = true;
    
    // counter vars
    var i = 0;
    var o = 0;
    
    for(o = 0; o < this.outputComps.length; o ++) {
      if(this.outputComps[o].type === "9 volt battery")
			has_battery = true;
    }
    
    // July 16th, 2013
    // Modified isGrounded and isPowered so that if component
    // is wired in a non-default way, then can check to see if
    // the other input/output comps provide a path to the battery
    //
    // Prior, wiring a resistor the "wrong" way would trick the simulator
    // into thinking that there was no route to the battery.  An incomplete
    // circuit.
    
    if(!has_battery) {
      for(o = 0; o < this.outputComps.length; o ++) {
				if(!this.outputComps[o].visited) {
					has_battery = this.outputComps[o].isGrounded(this);
					if(has_battery)
						break;
				}
      }
      // part where we try other components to see if this component was wired
      // the "wrong" way.
      if(!has_battery && !this.switched) {
				for(i = 0; i < this.inputComps.length; i ++) {
					if(this.inputComps[i].type === "9 volt battery") {
						has_battery = true;
						break;
					}
				}
				if(!has_battery) {
					for(i = 0; i < this.inputComps.length; i ++) {
						if(!this.inputComps[i].visited) {
							has_battery = this.inputComps[i].isGrounded(this);
							break;
						}
					}
				}
				if(has_battery) {
					switch_buffer = this.outputComps.slice(0);
					this.outputComps = this.inputComps.slice(0);
					this.inputComps = switch_buffer.slice(0);
					console.log(this.outputComps);
					console.log(this.inputComps);
				}
      }
    }
    this.visited = false;
    return has_battery;
  };
  
  /****************************************************************************
  *
  * Mutators
  * Much in the same way the "Accessors" are merely convenient shortcuts, these
  * are all really just convenient shortcuts for manipulating data in the
  * objects
  *
  ****************************************************************************/
  
  //Formally just setX, but used to emphasize that it belongs to Component
  //Helpful when removing the setX functions of other objects, which were
  //unnecessary and scheduled for removal
  this.setCompX = function(x) {
    var difference = x - this.xPos;
    this.xPos = x;
    this.inputTerm.xPos = (this.inputTerm.xPos + difference);
    this.outputTerm.xPos = (this.outputTerm.xPos + difference);
  };
  
  this.setCompY = function(y) {
    var difference = y - this.yPos;
    this.yPos = y;
    this.inputTerm.yPos = (this.inputTerm.yPos + difference);
    this.outputTerm.yPos = (this.outputTerm.yPos + difference);
  };
  
  this.setVoltage = function(v) {
    this.voltage = v;
    this.current = this.voltage / this.resistance;
  };
  
  this.setResistance = function(r) {
    this.resistance = r;
    this.summedResist = r;
  };
  
  this.setSeriesIntersect = function(series) {
  
    var unique = true;
    console.log(series);
    
    for(var ss in series) {
      for(var s in this.seriesSum) {
				if(series[ss] === this.seriesSum[s]) {
					unique = false;
					console.log("this component isn't unique");
					break;
				}
      }
      if(unique) {
				this.future_series_sum.push(series[ss]);
				console.log("found a unique component");
      }
      unique = true;
    }
    if(this.entity_of)
      this.entity_of.updateSeriesSum(this.future_series_sum);
  };
    
  this.setParallelCluster = function(parallel_input) {
    
    var other_series_sum;
    
    var unique = true;
    
    if(!this.entity_of)
      this.parallelSeriesSum = this.seriesSum.slice(0);
    else
      this.entity_of.parallelSeriesSum = this.seriesSum.slice(0);
    
    if(!this.cluster_update) {
      this.parallel_cluster = this.seriesSum.slice(0);
    }
    
    other_series_sum = parallel_input.seriesSum.slice(0);
    
    for(var pr in other_series_sum) {
      for(var rc in this.parallel_cluster) {
				if(this.parallel_cluster[rc] == other_series_sum[pr])
					unique = false;
      }
      if(unique)
				this.parallel_cluster.push(other_series_sum[pr]);
			unique = true;
    }
    
    this.cluster_update = true;
    if(this.entity_of)
      this.entity_of.setClusterUpdate(this.parallel_cluster);
  };
  
  this.setOnImg = function(src) {
    onImg = new Image();
    onImg.src = src;
  };
  
  this.setInputWire = function(wire) { this.inputTerm.connectedTo = wire; };
  
  this.setInputComponent = function() {
  
    var input_wire = this.getInputWire();
    var inputs;
    
    // counter vars
    var i = 0;
    
    if(input_wire && input_wire.connectedToLeft &&
      input_wire.connectedToRight) {
			if(input_wire.connectedToLeft == this) {
				inputs = input_wire.connectedToRight;
			}
			else {
				inputs = input_wire.connectedToLeft;
			}
      
			if(inputs.type === "Branch") {
				inputs = inputs.getComponents(input_wire);
			}
			else {
				inputs = [inputs];
			}
			for(i = 0; i < inputs.length; i ++) {
				if(inputs[i] == this) {
					this.shorted_flag = true;
				}
			}
		}
    console.log(this.inputComps);
    this.inputComps = inputs.slice(0);
    this.future_inputComps = inputs.slice(0);
    for (i = 0; i < this.inputComps.length; i ++) {
      console.log(this.inputComps[i].type);
    }
  };
  
  this.swapInputComponents = function(other_inputComps) {
    this.future_inputComps = other_inputComps.slice(0);
    this.swapInput = true;
  };
  
  // All this method does is take the input components from the component
  // it's bound to, and the component that serves as an arg, and combines the
  // the two.
  // It's up to updateResist to take the array of future_inputComps and peform
  // an intersection operation
  this.mergeInputComponents = function(input) {
  	/*
    var unique = true;
    var inputs = input.inputComps;
    var in_series_sum;
    */
    var inputs = input.inputComps;
    if(this.mergedInputs == 1)
	    this.future_inputComps = this.inputComps.slice(0);
	    
	  for(var i in inputs)
		  this.future_inputComps.push(inputs[i]);
		
    //if(this.entity_of)
    //  this.entity_of.setFutureInputs(this.future_inputComps);
    
    this.mergedInputs ++;
  };
  
  this.replaceInput = function(orig, replacement, lowerCluster) {
    
    // counter vars
    var i = 0;
    var r = 0;
    
    var replace_count = 0;
    var do_nothing;
    var already_there = false;
    
    for(i = 0; i < this.inputComps.length; i ++) {
      if(this.inputComps[i] == orig) {
				this.inputComps[i] = replacement;
      }
    }
    
    for(i = 0; i < this.inputComps.length; i ++) {
    	if(this.inputComps[i] == replacement && !already_there)
    		already_there = true;
    	else if(this.inputComps[i] == replacement) {
    		this.inputComps.splice(i, 1); i --;
    	}
    }
        
    for(i = 0; i < this.future_inputComps.length; i ++) {
      if(this.future_inputComps[i] == orig) {
				this.future_inputComps[i] = replacement;
      }
    }
    
    for(i = 0; i < this.future_inputComps.length; i ++) {
    	if(this.future_inputComps[i] == replacement && replace_count >=
    		this.mergedInputs) {
    		this.future_inputComps.splice(i, 1);
    		i --;
    	}
    	else if(this.future_inputComps[i] == replacement && replace_count <
    		this.mergedInputs)
    		replace_count ++;
    }
    
    if(this.entity_of) {
	    this.entity_of.grabInputs(this.inputComps, this.future_inputComps);
    }
  };
  
  this.setOutputWire = function(wire) { this.outputTerm.connectedTo = wire; };
  
  this.setOutputComponent = function() {
  
    var output_wire = this.getOutputWire();
    var outputs;
    
    // counter vars
    var o = 0;
    
    if(output_wire && output_wire.connectedToLeft &&
      output_wire.connectedToRight) {

      if(output_wire.connectedToLeft == this) {
				outputs = output_wire.connectedToRight;
      }
      else {
				outputs = output_wire.connectedToLeft;
      }
      
      if(outputs.type === "Branch") {
				outputs = outputs.getComponents(output_wire);
      }
      else {
				outputs = [outputs];
      }
    }
    this.outputComps = outputs.slice(0);
    this.future_outputComps = outputs.slice(0);
    for(o = 0; o < this.outputComps.length; o ++) {
      console.log(this.outputComps[o].type);
    }
  };
  
  this.swapOutputComponents = function(other_outputComps) {
    this.future_outputComps = other_outputComps.slice(0);
    this.swapOutput = true;
  };
  
  this.mergeOutputComponents = function(output) {

    var outputs = output.outputComps;
    
    if(this.mergedOutputs == 1)
	    this.future_outputComps = this.outputComps.slice(0);
	    
	  for(var o in outputs)
		  this.future_outputComps.push(outputs[o]);

    //if(this.entity_of)
    //this.entity_of.setFutureOutputs(this.future_outputComps);
      
    this.mergedOutputs ++;
  };
  
  this.replaceOutput = function(orig, replacement, lowerCluster) {
    
    // counter vars
    var o = 0;
    var r = 0;
    
    var replace_count = 0;
    var do_nothing = false;
    var nothing_cluster;
    var already_there = false;
    	    
    for(o = 0; o < this.outputComps.length; o ++) {
      if(this.outputComps[o] == orig) {
				this.outputComps[o] = replacement;
				console.log("replacing output");
      }
    }
    
    for(o = 0; o < this.outputComps.length; o ++) {
    	if(this.outputComps[o] == replacement && !already_there)
    		already_there = true;
    	else if(this.outputComps[o] == replacement) {
    		this.outputComps.splice(o, 1); o --;
    	}
    }
    
    already_there = false;
    
    for(o = 0; o < this.future_outputComps.length; o ++) {
      if(this.future_outputComps[o] == orig) {
				this.future_outputComps[o] = replacement;
				console.log("replacing output");
      }
    }
    
    for(o = 0; o < this.future_outputComps.length; o ++) {
    	if(this.future_outputComps[o] == replacement && replace_count >=
    		this.mergedOutputs) {
    		this.future_outputComps.splice(o, 1);
    		o --;
    	}
    	else if(this.future_outputComps[o] == replacement && replace_count <
    		this.mergedOutputs)
    		replace_count ++;
    }
    
    if(this.entity_of) {
	    this.entity_of.grabOutputs(this.outputComps, this.future_outputComps);
    }
  };
  
  this.updateResistance = function(powered) {
  
  	var count;
  	var splice_count = 0;
  	var input;
  	var output;
    var resistor_cluster;
  	
  	// The two loops below are a process used for transferring over inputComps
  	// without getting duplicates / only getting those inputs that are common
  	// to all merged inputs/outputs.
  	if(this.mergedInputs > 1) {
  	
  		this.inputComps = [];
	    while(this.future_inputComps.length) {
	    
	    	input = this.future_inputComps.slice(0, 1);
	    	count = 0;
		    for(var i = 0; i < this.future_inputComps.length; i++) {
			    if(input[0] == this.future_inputComps[i]) {
				    count ++;
				    if(count >= this.mergedInputs)
					    this.inputComps.push(input[0]);
					  this.future_inputComps.splice(i, 1);
					  i --;
					}
		    }
		    
	    }
	    this.mergedInputs = 1;
	    
	  }
	  
	  else if (this.swapInput) {
	  	this.inputComps = this.future_inputComps.slice(0);
	  	this.swapInput = false;
	  }
	      
    if(this.mergedOutputs > 1) {
    
    	this.outputComps = [];
    	while(this.future_outputComps.length) {
    	
    		output = this.future_outputComps.slice(0, 1);
	    	count = 0;
		    for(var o = 0; o < this.future_outputComps.length; o ++) {
			    if(output[0] == this.future_outputComps[o]) {
				    count ++;
				    if(count >= this.mergedOutputs)
					    this.outputComps.push(output[0]);
						this.future_outputComps.splice(o, 1);
						o --;
				  }
		    }
	    }
	    this.mergedOutputs = 1;
	    
    }
    
    else if (this.swapOutput) {
    	this.outputComps = this.future_outputComps.slice(0);
    	this.swapOutput = false;
    }
                
    this.seriesSum = this.future_series_sum.slice(0);
    
    if(this.cluster_update) {
			resistor_cluster = new CompCluster(this.parallel_cluster,
					this.inputComps, this.outputComps, powered);
      this.entity_of.setAndReplace();
    }
    
    this.future_series_sum = this.seriesSum.slice(0);
    
    if(this.entity_of)
      this.entity_of.updateResistance(powered);
    
    this.summedResist = 0;
    for(var s in this.seriesSum) {
      this.summedResist += this.seriesSum[s].resistance;
      if(this.seriesSum[s].type == "Virtual Component")
				this.seriesSum[s].updateEffective();
			console.log(this.seriesSum[s]);
    }
    console.log(this.summedResist);
  };
  
  this.removeConnect = function(orig) {
    if(this.getInputWire() == orig) {
      this.inputTerm.connectedTo = null;
    }
    else if(this.getOutputWire() == orig) {
      this.outputTerm.connectedTo = null;
    }
  };
    
  /**************************************
   ** 		**Other**		**
   **************************************/
  
  this.setTerms = function(termIX, termIY, termOX, termOY, neutral) {
    
    if (!this.inputTerm) { this.inputTerm = new Terminal(termIX, termIY, this, "Positive"); }
    else {
      this.inputTerm.xPos = termIX;
      this.inputTerm.yPos = termIY;
    }
    
    if(!this.outputTerm) { this.outputTerm = new Terminal(termOX, termOY, this, "Negative"); }
    else {
      this.outputTerm.xPos = termOX;
      this.outputTerm.yPos = termOY;
    }
    
    if(neutral) {
      this.inputTerm.charge = "Neutral";
      this.outputTerm.charge = "Neutral";
    }
  };
  
  this.drawTerms = function(context) {
    if(this.inputTerm) { this.inputTerm.draw(context, 'red'); }
    if(this.outputTerm) { this.termN.draw(context, 'black'); }
  };
  
  this.isOver = function(mouseX, mouseY) {
    if(mouseX > this.xPos && mouseX < this.width + this.xPos)
      if(mouseY > this.yPos && mouseY < this.height + this.yPos)
				return true;
  };
  
  this.isOverTerminals = function(mouseX, mouseY) {
    if(this.inputTerm.isOver(mouseX, mouseY)) return this.inputTerm;
    if(this.outputTerm.isOver(mouseX, mouseY)) return this.outputTerm;
  };
}


/*****************************************************************************
 * 
 * CompCluster
 *
 * Vaguely similar to Component, only used for calculating values when
 * simulating circuits
 * It's basically a representation of a cluster of components
 *
 * PARAM r: The resistance of component cluster
 * PARAM cluseter: an array containg the components in the cluster
 * PARAM inputs: an array containing the components directly connected to the
 * cluster.
 * PARAM outputs: an array containg, wait or it....the outputs
 * 
 * ***************************************************************************/
function CompCluster(cluster, inputs, outputs, p) {
  this.resistance = 0;
  this.summedResist = 0;
  this.futureSummedResist = 0;
  this.future_resistance = 0;
  this.poweredComps = p;
  
  this.type = "Virtual Component";
  
  this.seriesSum = [this];
  this.future_series_sum = [this];
  this.parallelSeriesSum = [];
  
  //the components that constitute this 
  this.cluster_entities = cluster;
  // basically, this is an array consisting of arrays, the secondary arrays
  // being the different parallel series from the components that constitute
  // the cluster, sorted out so that each entry is unique
  this.cluster_paraseries = [];
  
  this.parallel_cluster = null;
  
  this.inputComps = inputs.slice(0);
  this.outputComps = outputs.slice(0);
  
  this.future_inputComps = inputs.slice(0);
  this.future_outputComps = outputs.slice(0);
  
  this.unique = true;
  
  //counter vars
  var ce;
  var cps;
  
  for (ce = 0; ce < this.cluster_entities.length; ce ++) {
  	// make sure that each component in the cluster knows that it's part of
  	// this component cluster
    this.cluster_entities[ce].entity_of = this;
    // if the cluster_paraseries is empty, basically
    if(!this.cluster_paraseries.length) {
    	// copy the parallel series sum over, begin to calc parallel resitance
      this.cluster_paraseries.push(this.cluster_entities[ce].parallelSeriesSum.slice(0));
      if (this.cluster_entities[ce].summedResist)
      	this.resistance = 1 / this.cluster_entities[ce].summedResist;
      else
      	this.resistance = 0;
    }
    else {
      for(cps = 0; cps < this.cluster_paraseries.length; cps ++) {
				if(equal_array(this.cluster_paraseries[cps],
					this.cluster_entities[ce].parallelSeriesSum)) {
					this.unique = false;
					break;
				}
      }
      if(this.unique) {
				this.cluster_paraseries.push(this.cluster_entities[ce].parallelSeriesSum.slice(0));
				if (this.cluster_entities[ce].summedResist)
					this.resistance += 1/this.cluster_entities[ce].summedResist;
			}
			this.unique = true;
    }
  }
  this.resistance = Math.pow((this.resistance), -1);
  this.summedResist = this.resistance;
  this.futureSummedResist = this.resistance;
  
  for(ce = 0; ce < this.cluster_entities.length; ce ++) {
	  this.cluster_entities[ce].entity_of = this;
  }
    
  this.entity_of = null;
  this.cluster_update = false;
  
  /**************************************
   * 		**Accessors**		*
   * ************************************/
  
  this.getEffectiveResistance = function() { return this.summedResist; };
  
  /**************************************
   * 		**Mutators**		*
   * ************************************/
   
  this.setAndReplace = function() {
  	
  	var properCluster;
  	var safe_array = this.poweredComps.slice(0);
  	var intermediate_array = [];
  	
  	// counter vars
  	var i;
  	var ce;
  	var s;
  	
  	if(this.entity_of) {
	  	properCluster = this.entity_of.setAndReplace();
  	}
  	else {
	  	properCluster = this;
  	}
  	
	  for (ce = 0; ce < this.cluster_entities.length; ce ++) {
		  this.cluster_entities[ce].seriesSum = [];
		  this.cluster_entities[ce].future_series_sum = [];
		  this.cluster_entities[ce].seriesSum.push(properCluster);
		  this.cluster_entities[ce].future_series_sum.push(properCluster);
		  this.cluster_entities[ce].cluster_update = false;
		  
			if(!this.entity_of) {
			  // this part is a doozy.  Basically, we're modifying the array of "safe"
			  // components to remove any components that are contained in the cluster
			  // entities
			  if(this.cluster_entities[ce].type !== "Virtual Component") {
				  for(s = 0; s < safe_array.length; s ++) {
					  if(safe_array[s] == this.cluster_entities[ce]) {
						  safe_array.splice(s, 1);
						  break;
					  }
				  }
			  }
			  // Of course, it's a problem if one of the objects occupying the array of
			  // cluster_entities is a CompCluster itself.  We don't care, we want its
			  // "real" components.  So, create an intermediate array, which is a copy
			  // of its cluster entities, and go through the process of removing any
			  // "real" components from the safe_array that are also a cluster_entitiy
			  //
			  // Note to self, look into the benefits of making it such that intermediate
			  // is "eaten" rather than traversed
			  else {
				  intermediate_array = this.cluster_entities[ce].cluster_entities.slice(0);
				  for(var i = 0; i < intermediate_array.length; i ++) {
					  if(intermediate_array[i].type !== "Virtual Component") {
						  for(s = 0; s < safe_array.length; s ++) {
							  if(safe_array[s] == intermediate_array[i]) {
								  safe_array.splice(s, 1);
								  break;
							  }
						  }
					  }
					  // Naturally, virtual components could be in the intermediate array as
					  // well.  So, concat that component's cluster_entities onto intermediate,
					  // then splice the virtual component out of the array
					  else {
						  intermediate_array = intermediate_array.concat(
						  	intermediate_array[i].cluster_entities);
						  intermediate_array.splice(i, 1);
						  i --;
					  }
				  }
			  }
			} // endif(!this.entity_of)
	  }
	  
	  if(!this.entity_of) {
		  for(ce = 0; ce < this.cluster_entities.length; ce ++ ) {
			  for(s = 0; s < safe_array.length; s ++) {
				  safe_array[s].replaceInput(this.cluster_entities[ce], this);
				  safe_array[s].replaceOutput(this.cluster_entities[ce], this);
			  }
			}
		}
	  return this;
  };
  
  this.setResistance = function(r) {
    this.resistance = r;
    this.summedResist = r;
  };
  
  this.setClusterUpdate = function(cluster) {
    this.parallel_cluster = cluster;
    this.cluster_update = true;
  };
  
  this.grabOutputs = function(outputs, future_outputs) {
  	this.outputComps = outputs.slice(0);
    this.future_outputComps = future_outputs.slice(0);
    if(this.entity_of)
      this.entity_of.grabOutputs(this.outputComps, this.future_outputComps);
  };
  
  this.grabInputs = function(inputs, future_inputs) {
		this.inputComps = inputs.slice(0);
    this.future_inputComps = future_inputs.slice(0);
    if(this.entity_of)
      this.entity_of.grabInputs(this.inputComps, this.future_inputComps);
  };
  
  this.swapInputComponents = function(other_inputComps) {
    for(var ce in this.cluster_entities) {
      this.cluster_entities[ce].swapInputComponents(other_inputComps);
      this.cluster_entities[ce].swapInput = true;
    }
  };
  
  this.swapOutputComponents = function(other_outputComps) {
    for(var ce in this.cluster_entities) {
      this.cluster_entities[ce].swapOutputComponents(other_outputComps);
      this.cluster_entities[ce].swapOutput = true;
    }
    // this.future_outputComps = other_outputComps.slice(0);
  };
    
  this.updateEffective = function() {
    this.summedResist = 0;
    for(var s in this.seriesSum) {
      this.summedResist += this.seriesSum[s].resistance;
    }
  };
  
  this.updateResistance = function(powered) {
    this.inputComps = this.cluster_entities[0].inputComps;
    this.outputComps = this.cluster_entities[0].outputComps;
        
    var resistor_cluster;
    
    this.seriesSum = this.future_series_sum.slice(0);
        
    if(this.cluster_update) {
			resistor_cluster = new CompCluster(this.parallel_cluster, this.inputComps,
				this.outputComps, this.poweredComps);
      this.entity_of.setAndReplace();
		}
    
    this.future_series_sum = this.seriesSum.slice(0);
    
    if(this.entity_of)
      this.entity_of.updateResistance(powered);
    
    this.summedResist = 0;
    for(var s in this.seriesSum) {
      this.summedResist += this.seriesSum[s].resistance;
      if(this.seriesSum[s].type == "Virtual Component")
				this.seriesSum[s].updateEffective();
    }
    console.log(this.summedResist);
  };
  
  this.updateSeriesSum = function (sum) {
    this.future_series_sum = sum.slice(0);
  };
  
}
  

/******************************************************************************
* 
* Wire
*
* Honestly, just think of it as a very special form of line.
*
* PARAM x1: The starting x-coordinate of the line.
* PARAM y1: The starting y-coordinate of the line.
* PARAM x2: The ending x-coordinate of the line.
* PARAM y2: The ending y-coordinate of the line.
* 
* ****************************************************************************/
function Wire(x1, y1, x2, y2) {
  
  this.startX = x1 || 0;
  this.startY = y1 || 0;
  
  this.endX = x2 || 0;
  this.endY = y2 || 0;
  
  this.slope = 0.0;
  this.strokeStyle = state.wire_color;
  
  this.connectedToLeft = null;
  this.connectedToRight = null;
  
  this.startTerm = null;
  this.endTerm = null;
  
  this.highlight = false;
  
  this.draw = function(context) {
    context.beginPath();
    
    context.moveTo(this.startX, this.startY);
    context.lineTo(this.endX, this.endY);
    
    context.strokeStyle = this.strokeStyle || 'black';
    
    if(this.highlight) { context.lineWidth = 4; }
    else { context.lineWidth = 2; }
    context.stroke();
  };
      
  
  /************************************
  * Accessors
  ************************************/
  
  this.getStart = function() { return { x: this.startX, y: this.startY }; };
  
  this.getEnd = function() { return { x: this.endX, y: this.endY }; };
    
  /************************************
  * Mutators
  **********************************/
  
  this.setStart = function(x, y) { this.startX = x; this.startY = y; };
  
  this.setEnd = function(x, y) { this.endX = x; this.endY = y; };
  
  this.setStartObj = function(obj) {
    this.startTerm = obj;
    this.startX = obj.xPos;
    this.startY = obj.yPos;
    if(this.endTerm) {
      this.connectedToLeft = this.startTerm.attachedTo;
      this.connectedToRight = this.endTerm.attachedTo;
      this.startTerm.connectedTo = this;
      this.endTerm.connectedTo = this;
    }
  };
  
  this.setEndObj = function(obj) {
    this.endTerm = obj;
    this.endX = obj.xPos;
    this.endY = obj.yPos;
    if(this.startTerm) {
      this.connectedToLeft = this.startTerm.attachedTo;
      this.connectedToRight = this.endTerm.attachedTo;
      this.startTerm.connectedTo = this;
      this.endTerm.connectedTo = this;
    }
  };
    
  
  /************************************
  * Other
  ************************************/
  
  this.isOver = function(mouseX, mouseY) {

    if(this.startX != this.endX) {
      this.slope = (this.endY - this.startY) / (this.endX - this.startX);
    }
    else { this.slope = "undef"; }
    
    if(this.slope !== "undef") {
      //standard diagonal line case
      var y_intercept = this.startY - (this.slope * this.startX);
      var y_point = mouseX * this.slope + y_intercept;
      
      if(mouseY >= y_point -5 && mouseY <= y_point + 5) {
      	var lesserX;
				var greaterX;
				if(this.startX > this.endX) {
					greaterX = this.startX;
					lesserX = this.endX;
				}
				else {
					greaterX = this.endX;
					lesserX = this.startX;
				}
				if(mouseX >= lesserX - 4 && mouseX <= greaterX + 4) {
					this.highlight = true;
					return this.highlight;
				}
      }
    }
    else {
      if (mouseX >= this.startX - 5 && mouseX <= this.startX + 5) {
				var lesserY;
				var greaterY;
				if(this.startY > this.endY) {
					greaterY = this.startY;
					lesserY = this.endY;
				}
				else {
					greaterY = this.endY;
					lesserY = this.startY;
				}
				if(mouseY >= lesserY && mouseY <= greaterY) {
					this.highlight = true;
					return this.highlight;
				}
      }
    }
    this.highlight = false;
    return this.highlight;
  };
}

/******************************************************************************
 * 
 * WireBranch
 *
 * Basically, when you connected wires to other wires, these guys are created
 * They're used to help the user make sure that when they draw wires together,
 * that these new wires are actually carrying the flow of electricity
 * They also enable the wires to "branch out"
 *
 * PARAM x - The x-coordinate of the wire branch
 * PARAM y - The y-coordinate of the wire branch
 * PARAM wires - The wires that are attached to this wire branch
 * 
 * ***************************************************************************/

function WireBranch(x, y, wires) {
  
  this.xPos = x || 0;
  this.yPos = y || 0;
  
  this.radius = 5;
  
  this.connectedTo = wires || [];
  
  this.terminal = new Terminal(x, y, this);
    
  this.type = "Branch";
  
  this.draw = function(context) {
    context.beginPath();
    context.arc(this.xPos, this.yPos, this.radius, 0, 2 * Math.PI, false);
    
    context.fillStyle = 'blue';
    context.fill();
    
    context.lineWidth = 1;
    context.strokeStyle = 'black';
    context.stroke();
  };
  
  /*************************************
   * 		**Accessors**		*
   *************************************/
  
  this.getComponents = function(wire) {
    var connect_copy = this.connectedTo;
    var inputs = [];
    var received_inputs;
    
    //counter vars
    var w = 0;
    
    for(w = 0; w < connect_copy.length; w ++) {
      if(connect_copy[w] == wire) {
				connect_copy.splice(w, 1);
				break;
      }
    }
        
    for(w = 0; w < connect_copy.length; w ++) {
      if(connect_copy[w].connectedToLeft == this) {
				inputs.push(connect_copy[w].connectedToRight);
      }
      else {
				inputs.push(connect_copy[w].connectedToLeft);
      }
      if(inputs[inputs.length-1].type === "Branch") {
				inputs[inputs.length-1] = inputs[inputs.length-1].getComponents(connect_copy[w]);
				if(inputs[inputs.length-1].length == 1) {
					inputs[inputs.length-1] = inputs[inputs.length-1][0];
				}
				else {
					received_inputs = inputs.pop();
					console.log("these are the received inputs: " + received_inputs);
					for(var ri in received_inputs) {
						inputs.push(received_inputs[ri]);
					}
				}
      }
    }
    connect_copy.push(wire);
    console.log(inputs);
    return inputs;
  };
  
  /*************************************
  * Mutators
  *************************************/
  
  this.addConnect = function(obj) {
    this.connectedTo.push(obj); 
  };
  
  this.removeConnect = function(obj) {
    for (var c in this.connectedTo) {
      if (this.connectedTo[c] == obj) {
				this.connectedTo.splice(c, 1);
				return true;
      }
    }
  };
  
  /*************************************
   * 		**Other**		*
   * ***********************************/
  
  this.isOver = function(mouseX, mouseY) {
    if(mouseX > (this.xPos - this.radius) && mouseX < (this.xPos + this.radius))
      if(mouseY > (this.yPos - this.radius) && mouseY < (this.yPos + this.radius))
				return true;
  };
      
  this.isConnected = function(obj) {
    for(var c in this.connectedTo)
      if(this.connectedTo[c] == obj)
				return true;
    return false;
  };
}


/******************************************************************************
 * 
 * Terminal
 *
 * Object attached to components to basically accept wires and
 * handle connections between its host Component and other Components
 *
 * PARAM x - the x-coordinate of the terminal
 * PARAM y - the y-coordinate of the terminal
 * PARAM obj - the component the terminal is attached to
 * PARAM PosNeg - parameter for the charge of the terminal
 * 
 * ***************************************************************************/
function Terminal(x, y, obj, PosNeg) {
  
  this.xPos = x || 0;
  this.yPos = y || 0;
  
  this.radius = 5;
  
  this.attachedTo = obj;
  this.connectedTo = null;
  
  this.charge = PosNeg || "Neutral";
  
  this.draw = function(context, fill) {
    context.beginPath();
    context.arc(this.xPos, this.yPos, this.radius, 0, 2 * Math.PI, false);
    context.lineWidth = 1;
    context.strokeStyle = 'black';
    context.stroke();
  };
  
  /************************************
  * Other
  ************************************/
  
  this.isOver = function(mouseX, mouseY) {
    if(mouseX > (this.xPos - this.radius) && mouseX < (this.xPos + this.radius))
      if(mouseY > (this.yPos - this.radius) && mouseY < (this.yPos + this.radius))
				return true;
  };
}
    
/******************************************************************************
 * 
 * canvasState
 *
 * The mystical magical object responsible for, well, keeping track of the
 * state of the canvas.
 *
 * PARAM canvas - THE canvas.  The HTML canvas element used to draw
 * everything on
 * 
 * ***************************************************************************/
function canvasState(canvas) {
  
  this.neveragain = false;
  
  //context that all the interactive bits are drawn on
  var fg_context = canvas.getContext('2d');
	
	//less interesting stuff goes here
  var background = document.createElement('canvas');
  background.width = 800;
  background.height = 500;
  var bg_context = background.getContext('2d');
  this.highlights = null;
  setup_grid(bg_context, this.highlights);

	//all the manipulatable objects on canvas here
  this.components = [];
  //this.resistors = [];
  this.wires = [];
  this.branches = [];
  
  //attributes specifically for dragging
  this.dragging = false;
  this.xOffset = 0;
  this.yOffset = 0;
  
  //Button states.  At any point only one of these can be true
  this.default = true;
  this.rotating = false;
  this.drawing = false;
  this.color_select = false;
  this.erasing = false;
  this.open_chest = false;
  this.simulating = false;
  
  //The current color of the wire
  this.wire_color = "black";
  
  //attributes indicatign if mouse is over any of the buttons
  this.over_indicate = false;
  this.over_draw = false;
  this.over_erase = false;
  this.over_simulate = false;
  
  //the button cover image.  "Houses" the buttons.
  var button_cover = new Image();
  button_cover.src = "/static/button_cover.png";
  button_cover.onload = function() {
    bg_context.drawImage(button_cover, 730, 10);
  };
  
  //Drag button.  Self explanatory
  var drag_indicate = new Image();
  drag_indicate.src = "/static/move_button.png";
  
  //Image for when drag button is on.  Since state is set to drag by default,
  //the default is for this image to display first
  var indicate_on = new Image();
  indicate_on.src = "/static/move_button_on.png";
  indicate_on.onload = function() {
    fg_context.drawImage(indicate_on, 740, 30);
  };
  
  //Rotate button, self explanatory
  var rotate_button = new Image();
  rotate_button.src = "/static/rotate_button.png";
  rotate_button.onload = function() {
    fg_context.drawImage(rotate_button, 740, 80);
  };
  
  var rotate_button_on = new Image();
  rotate_button_on.src = "/static/rotate_button_on.png";
	
	//The wire button, for drawing wires obviously
  var wire_button = new Image();
  wire_button.src = "/static/test.png";
  wire_button.onload = function() {
    fg_context.drawImage(wire_button, 740, 130);
  };
  
  var wire_button_on = new Image();
  wire_button_on.src = "/static/test_on.png";
  
  //Color tab, for wires, pops out when you press wire button
  var color_tab = new Image();
  color_tab.src = "/static/color_tab.png";
	
	//Erase button.  Currently only erases wires
  var erase_button = new Image();
  erase_button.src = "/static/erase_button.png";
  erase_button.onload = function() { 
    fg_context.drawImage(erase_button, 740, 180);
  };

  var erase_button_on = new Image();
  erase_button_on.src = "/static/erase_button_on.png";
  
  //The treasure_chest button.  Used to open the "inventory"
  var treasurechest_button = new Image();
  treasurechest_button.src = "/static/treasurechest.png";
  treasurechest_button.onload = function() {
    fg_context.drawImage(treasurechest_button, 740, 230);
  };

	//Simulate toggle switch
  var simulate_button = new Image();
  simulate_button.src = "/static/toggle_build.png";
  simulate_button.onload = function() {
    fg_context.drawImage(simulate_button, 740, 390);
  };

  var simulate_button_on = new Image();
  simulate_button_on.src = "/static/toggle_simulate.png";
  
  //Anytime the state is refreshed, things are redrawn on the canvas and if
  //necessary, different images are used, or different flags are thrown
  this.refresh = function() {
  
  	//counter vars
  	var i;
    
    //neat little hack to basically wipe the canvas clean
    //note that we're only wiping the foreground, background is untouched
    //runs faster that way
    canvas.width = canvas.width;
    fg_context.drawImage(background, 0, 0);
    
    //Basically, if we're not doing anything, then drag button is on by default
    if(!(this.drawing || this.erasing || this.simulating || this.rotating)) {
      fg_context.drawImage(indicate_on, 740, 30);
    }
    //The else conditional always draws the "off" button image instead
    else { fg_context.drawImage(drag_indicate, 740, 30); }
    
    //Rotate button
    if(this.rotating) {
      fg_context.drawImage(rotate_button_on, 740, 80);
    }
    else { fg_context.drawImage(rotate_button, 740, 80); }
		
		//Wire button
    if(this.drawing) { 
      fg_context.drawImage(wire_button_on, 740, 130); 
      this.killSimulation();
    }
    else {fg_context.drawImage(wire_button, 740, 130); }
    
    //The color tab doesn't have an else conditional.  If we don't need it,
    //then don't even bother drawing it to the canvas
    if(this.color_select) {
      fg_context.drawImage(color_tab, 470, 120);
    }
    
    //Erase button
    if(this.erasing) { 
      fg_context.drawImage(erase_button_on, 740, 180);
      this.killSimulation();
    }
    else { fg_context.drawImage(erase_button, 740, 180); }
    
    //Right now the treasure chest button actually doesn't have on img
    //Will fix soon
    fg_context.drawImage(treasurechest_button, 740, 230);

		//All other buttons had two line if-blocks
		//This is because pressing this kills the simulation
		//For this simualate button, this is obviously unnecessary
    if(this.simulating) { fg_context.drawImage(simulate_button_on, 740, 390); }
    else { fg_context.drawImage(simulate_button, 740, 390); }

		//Now that buttons are out of way, draw all the components in the state
    for(i = 0; i < this.components.length; i++) {
      this.components[i].draw(context);
      this.components[i].display_flag = false;
    }
    
    //Then, draw the wires
    for(i = 0; i < this.wires.length; i++) { this.wires[i].draw(context); }
    
  };
  
  /************************************
  * Mutators
  ************************************/
  
  //It is extremely important that you use the following mutators to set the
  //button states
  //Otherwise, you're gonna have a bad time
  this.setDefault = function(bool) {
    if(bool) {
      this.default = true;
      
      this.rotating = false;
      this.drawing = false;
      this.color_select = false;
      this.erasing = false;
      this.simulating = false;
    }
  };

  this.setDrawing = function(bool) {
    if(bool) {
      this.drawing = true;
      
      this.default = false;
      this.rotating = false;
      this.color_select = false;
      this.erasing = false;
      this.simulating = false;
    }
    else {
      this.drawing = false;
      this.default = true;
    }
  };
  
  this.setColorSelect = function(bool) {
    if(bool) {
      this.color_select = true;
      
      this.default = false;
      this.rotating = false;
      this.drawing = false;
      this.erasing = false;
      this.simulating = false;
    }
    else {
      this.color_select = false;
      this.default = true;
    }
  };

  this.setErasing = function(bool) { 
    if(bool) {
      this.erasing = true;
      
      this.default = false;
      this.rotating = false;
      this.drawing = false;
      this.color_select = false;
      this.simulating = false;
    }
    else {
      this.erasing = false;
      this.default = true;
    }
  };
  
  this.setRotating = function(bool) {
    if(bool) {
      this.rotating = true;
      
      this.default = false;
      this.drawing = false;
      this.color_select = false;
      this.erasing = false;
      this.simulating = false;
    }
    else {
      this.rotating = false;
      this.default = true;
    }
  };
  
  this.setOpening = function(bool) {
	  if(bool) {
		  this.open_chest = true;
		  
		  this.default = false;
		  this.drawing = false;
		  this.color_select = false;
		  this.erasing = false;
		  this.simulating = false;
	  }
	  else {
		  this.open_chest = false;
		  this.default = true;
	  }
  };
  
  this.addComponent = function(component) {
    this.components.push(component);
  };
  
  this.addWire = function(wire) {
  
    wire.draw(context);
    
    var wire_start = wire.getStart();
    var wire_startObj = wire.startTerm;
    
    var wire_end = wire.getEnd();
    var wire_endObj = wire.endTerm;
    
    if(!wire_startObj) {
      console.log("new branch");
      branch = new WireBranch(wire_start.x, wire_start.y, [wire]);
      this.branches.push(branch);
      wire.setStartObj(branch.terminal);
    }
    
    if(!wire_endObj) {
      console.log("new branch end");
      branch = new WireBranch(wire_end.x, wire_end.y, [wire]);
      this.branches.push(branch);
      wire.setEndObj(branch.terminal);
    }
    
    this.wires.push(wire);
  };
  
  this.removeWire = function(wire) {
    for (var w in this.wires) {
      if (this.wires[w] == wire) {
				var startObj = this.wires[w].startTerm.attachedTo;
				var endObj = this.wires[w].endTerm.attachedTo;
			if(startObj.type === "Branch") {
				startObj.removeConnect(this.wires[w]);
				if(!startObj.connectedTo.length) { this.removeBranch(startObj); }
			}
			if(endObj.type === "Branch") {
				endObj.removeConnect(this.wires[w]);
				if(!endObj.connectedTo.length) { this.removeBranch(endObj); }
			}
			this.wires.splice(w, 1); return true;
      }
    }
  };
  
  this.removeBranch = function(branch) {
    for (var b in this.branches) {
      if(this.branches[b] == branch) {
				this.branches.splice(b, 1);
				return true;
      }
    }
  };
  
  this.setHighlights = function(h) {
    highlights = h;
    background.width = background.width;
    setup_grid(bg_context, highlights);
  };
  
  /*************************************
   * 		**Other**		*
   * ***********************************/
  
  this.isOverComponent = function(mx, my) {
    
    //i.e. I don't want to see any annoying text when I'm drawing
    if(this.drawing)
      return false;
    
    for(var c in this.components) {
      var component = this.components[c];
      if(component.isOver(mx, my)) {
				var x = component.xPos;
				var y = component.yPos;
	
				component.display_flag = true;
	
				if(!this.dragging) {
					this.xOffset = mx - x;
					this.yOffset = my - y;
				}
				return this.components[c];
      }
    }
  };
  
  this.isOverTerminal = function(mouseX, mouseY) {
    
    for(var c in this.components) {
			var component = this.components[c];
      terminal = component.isOverTerminals(mouseX, mouseY);
      if(terminal) {
				terminal.draw(context);
				return terminal;
      }
    }
  };
  
  this.isOverWire = function(mouseX, mouseY) {
    for(var w in this.wires) {
      var wire = this.wires[w];
      if(wire.isOver(mouseX, mouseY))
				return wire;
    }
  };
  
  this.isOverBranch = function(mouseX, mouseY) {
    for(var b in this.branches) {
      if(this.branches[b].isOver(mouseX, mouseY)) {
				this.branches[b].draw(context);
				return this.branches[b];
      }
    }
    return 0;
  };
  
  //Little more complicated than methods above
  //In this case, it not only checks, but also performs certain actions
  this.isOverButton = function(mouseX, mouseY, is_press) {
    
    var ret_val = false;
    
    //Was color_select flag trigged earlier?
    if(this.color_select && is_press)
      if(this.isOverColorTab(mouseX, mouseY)) { this.setDrawing(true); return true; }
    
    //Is it over the side panel?
    if(mouseX > 740 && mouseX < 780) {
      //Is it over the drag button?
      if(mouseY > 30 && mouseY < 70) {
				if(is_press)
					this.setDefault(true);
				else
					hover_move = true;
				ret_val = true;
      }
      //Is it over the rotated button?
      else if(mouseY > 80 && mouseY < 120) {
				if(is_press)
					this.setRotating(!this.rotating);
				else
					hover_rotate = true;
				ret_val = true;
      }
      //Is it over the wire-drawing button?
      else if(mouseY > 130 && mouseY < 170) {
				if(is_press) {
					//First, are we starting from a blank slate?
					if(!this.drawing && !this.color_select) {
						//if so, don't draw yet, turn the color_select flag on
						this.setColorSelect(true);
					}
					//Otherwise, take this as an indicator to cancel drawing
	  			else {
						this.setDrawing(false);
						this.setColorSelect(false);
					}
				}
				//If the is_press is false or undefined, just trip hover flag
				else
					hover_wire = true;
				ret_val = true;
      }
      //Is the mouse over the erase button?
      else if(mouseY > 180 && mouseY < 220) {
				if(is_press)
					this.setErasing(!this.erasing);
				else
					hover_erasing = true;
				ret_val = true;
      }
      //Is the mosue over the treasure chest?
      else if(mouseY > 230 && mouseY < 270 && !(this.open_chest) && is_press) {
      	this.setOpening(true);
				open_chest();
				//neveragain = true;
      }
      //Is it over the simulate button?
      else if(mouseY > 390 && mouseY < 470) {
				if(is_press)
					if(this.simulate)
						this.killSimulation();
					else
						this.startSimulation();
				else
					hover_simulating = true;
				ret_val = true;
      }
    }
    return ret_val;
  };
  
  this.isOverColorTab = function(mouseX, mouseY) {
  
    if(mouseY > 130 && mouseY < 170 && this.color_select) {
    	//This is the cancel button.  The big prominent red 'X'
      if(mouseX > 480 && mouseX < 530) {
				this.color_select = false;
				return false;
      }
      
      else if(mouseX > 530 && mouseX < 570) {
				this.wire_color = "blue";
				return true;
      }
      else if(mouseX > 580 && mouseX < 620) {
				this.wire_color = "green";
				return true;
      }
      else if(mouseX > 630 && mouseX < 670) {
				this.wire_color = "red";
				return true;
      }
      else if(mouseX > 680 && mouseX < 720) {
				this.wire_color = "black";
				return true;
      }
    }
    return false;
  };
  
  this.startSimulation = function() {
    
    var powered = [];
    
    this.erasing = false;
    this.drawing = false;
    this.simulating = true;
    this.rotating = false;
    
    var voltage = 0;
    var amps = 0;
    var total_resistance = 0;
    
    var mod_count = 0;
    
    // counter vars
    var c;
    var p;
    
    for(c = 0; c < this.components.length; c ++) {
      if(this.components[c].type === "9 volt battery") {
				voltage = this.components[c].voltage;
				console.log("Power Found. Voltage is: " + voltage);
      }
      
      if(this.components[c].type !== "9 volt battery") {
      	console.log("calculating inputs and outputs");
				this.components[c].setInputComponent();
				this.components[c].setOutputComponent();
      }
      
      this.components[c].simulate_flag = true;
    }
    
    console.log("checking connections");
    for(c = 0; c < this.components.length; c ++) {
      if(this.components[c].type !== "9 volt battery") {
				if(this.components[c].isPowered() && this.components[c].isGrounded()) {
					console.log(this.components[c].type + " is connected");
					powered.push(this.components[c]);
					this.components[c].on_off = true;
				}
      }
    }
    
    //This will need to be modified with a more detailed function
    //to calc total voltage dropped by LEDs  
    for(p = 0; p < powered.length; p ++) {
      if(powered[p].type === "LED") {
				voltage = voltage - powered[p].voltage;
      }
    }
    console.log("voltage minus LED forward voltages is :" + voltage);
    
    //modify this function to essentially ignore anything but resistors. 
    console.log("calculating total resistance..."); 
    total_resistance = calcTotalResist(powered, 0);
    console.log("total resistance is: " + total_resistance);
    
    amps = voltage / total_resistance;
    console.log("total amperage is: " + amps);
    for(c = 0; c < this.components.length; c ++)
      if(this.components[c].type === "9 volt battery")
				this.components[c].current = amps;
    
    console.log("now finding individual resistor voltage drops");  
    calc_current_volt(powered, amps, 0);
    
    return 0;

  };
  
  
	//October 1st
	//Modifified mod resist, not only modifies seriesSum of a component if that
	//component is a resistor.  Otherwise, merely trades inputs
  calcTotalResist = function(powered, mod_count) {
  	console.log("calculating total resistance");
    var inputs;
    var outputs;
    var current_sum;
    var current_cluster;
    
    var done = true;
    
    var final_resistance;
        
    //counter vars
    var p;
    var i;
    var o;
    
    for(p = 0; p < powered.length; p ++) {
    	console.log("Quick Hack Here");
			inputs = powered[p].inputComps;
			console.log(inputs[0]);
			outputs = powered[p].outputComps;
			console.log(outputs);

			if(inputs.length == 1 && inputs[0].type !== "9 volt battery") {
				console.log("merging input");
				powered[p].setSeriesIntersect(inputs[0].seriesSum);
				powered[p].swapInputComponents(inputs[0].inputComps);
				inputs[0].swapOutputComponents(powered[p].outputComps);
			}

			else {
				for(i = 0; i < inputs.length; i ++) {
					for(o = 0; o < outputs.length; o ++) {
						if(equal_series_sum(outputs[o], inputs[i]) &&
						inputs[i].type !== "9 volt battery") {
							powered[p].setParallelCluster(inputs[i]);
							powered[p].mergeInputComponents(inputs[i]);
							powered[p].mergeOutputComponents(outputs[o]);
							console.log("parallel components");
							break;
						}
					}
				}
			}

			if(outputs.length == 1 && outputs[0].type !== "9 volt battery") {
				console.log("merging output");
				powered[p].setSeriesIntersect(outputs[0].seriesSum);
				powered[p].swapOutputComponents(outputs[0].outputComps);
				outputs[0].swapInputComponents(powered[p].inputComps);
			}
    }
    
    for(p = 0; p < powered.length; p ++) {
			powered[p].updateResistance(powered);
			inputs = powered[p].inputComps;
			outputs = powered[p].outputComps;
			
			if(inputs[0] !== outputs[0] || inputs[0].type !== "9 volt battery") {
				done = false;
			}
    }
    
    if(!done && mod_count < 10) {
      mod_count++;
      final_resistance = calcTotalResist(powered, mod_count);
    }
    else
      final_resistance = powered[0].summedResist;
    
    return final_resistance;      
  };
  
  calcForwardVoltage = function(powered, mod_count) {
  	console.log("calculating forward voltage");
    var inputs;
    var outputs;
    var current_sum;
    var current_cluster;
    
    var done = true;
    
    var finalVoltage;
    
    // counter vars
    var p = 0;
    var i = 0;
    var o = 0;
    
    for(p = 0; p < powered.length; p ++) {
	
			inputs = powered[p].inputComps;
			outputs = powered[p].outputComps;

			if(inputs.length == 1 && inputs[0].type !== "9 volt battery") {
				if(powered[p].type === "LED")
					powered[p].setSeriesIntersect(inputs[0].seriesSum);
				powered[p].swapInputComponents(inputs[0].inputComps);
				inputs[0].swapOutputComponents(powered[p].outputComps);
			}

			else {
				for(i = 0; i < inputs.length; i ++) {
					for(o = 0; o < outputs.length; o ++) {
						if(equal_series_sum(outputs[o], inputs[i]) &&
						inputs[i].type !== "9 volt battery") {
							if(powered[p].type === "resistor")
								powered[p].setParallelCluster(inputs[i]);
							powered[p].mergeInputComponents(inputs[i]);
							powered[p].mergeOutputComponents(outputs[o]);
							console.log("parallel components");
							break;
						}
					}
				}
			}

			if(outputs.length == 1 && outputs[0].type !== "9 volt battery") {
				console.log("merging output");
				if(powered[p].type === "resistor")
					powered[p].setSeriesIntersect(outputs[0].seriesSum);
				powered[p].swapOutputComponents(outputs[0].outputComps);
				outputs[0].swapInputComponents(powered[p].inputComps);
			}
    }
    
    for(p = 0; p < powered.length; p ++) {
      if(powered[p].type === "resistor") {
				powered[p].updateResistance(powered);
				inputs = powered[p].inputComps;
				outputs = powered[p].outputComps;

				if(inputs[0] !== outputs[0] || inputs[0].type !== "9 volt battery") {
					done = false;
				}
      }
    }
    
    if(!done && mod_count < 10) {
      mod_count++;
      final_resistance = calcTotalResist(powered, mod_count);
    }
    else
      final_resistance = powered[0].summedResist;
    
    return final_resistance;      
  };

  
  calc_current_volt = function(powered, amps, count) {
    var complete = true;
    var current_series;
    var current_paraseries;
    var para_resistance;
    var para_amps;
    var cluster_voltage;
    var pop_solve;
    var break_up;
    var counter = count + 1;
    
    // counter vars;
    var p;
    var pp;
    var cs;
    var cps;
      
    // traverse through the array of powered components
    for(p = 0; p < powered.length; p ++) {
    	
      current_series = powered[p].seriesSum;
      
      // basically, if the series_sum != powered[p] itself, then we're going
      // to do something with it
      if( !(current_series.length == 1 && (current_series[0] == powered[p] &&
      	current_series[0].type !== "Virtual Component") ) ) {
				
				// traverse through the list of components in the series sum
				for(cs = 0; cs < current_series.length; cs ++) {
					// if cs != a virtual component, we're going to use pop_solve with the
					// assumption that this component is in series, and break from the loop
					if(current_series[cs] != powered[p] &&
					current_series[cs].type !== "Virtual Component") {
						pop_solve = current_series[cs];
						complete = false;
						break;
					}
					// if it is a virtual component, we're going to break it apart, with
					// asusmption that this is component is basically a cluster of components
					// in parallel
					else if(current_series[cs] != powered[p] && !break_up) {
						break_up = current_series[cs];
						complete = false;
					}  
				}
				
				// if we assigned a component to pop_solve...
				if(pop_solve) {
					console.log("Popping");
					// we go ahead and assign the current of that component to whatever
					// the "total current" happens to be
					pop_solve.current = amps;
					if(pop_solve.type !== "LED")
						// then, we go ahead and set it's voltage equal to I * R, in accordance
						// with ohm's law 
						pop_solve.setVoltage(amps * pop_solve.resistance);
					
					// finally, we go through each powered component, check it's series_sum
					// attr, and if one of those summed components equals our pop_solve
					// component, we remove it from the array of series_sum comps, while
					// exercising care not to remove powered[pp] from its own series_sum
					for(pp = 0; pp < powered.length; pp ++) {
						current_series = powered[pp].seriesSum;
						for(cs = 0; cs < current_series.length; cs ++) {
							if(current_series[cs] != powered[pp] &&
							current_series[cs] == pop_solve) {
								current_series.splice(cs, 1);
								cs --;
							}
						}
					}
					pop_solve = 0;
				}
				
				// The rational here is that the voltage should be calculate for comps in
				// series first, then move to the stuff that's in clusters.
				else if(break_up && p == (powered.length - 1)) {
					
					// simple enough, assign paraseries, and keep track of a variable holding
					// the voltage dropped by this particular cluster of components
					current_paraseries = break_up.cluster_paraseries;
					cluster_voltage = break_up.resistance * amps || break_up.summedResist * amps;
					console.log("This is the voltage for the cluster: " + cluster_voltage);
					
					for(cps = 0; cps < current_paraseries.length; cps ++) {
						para_resistance = 0;
						// basically, we're calculating the combined resistance of all series
						// components in this paraseries, then we are assigning the current
						// parallel series sum to the component below
						for(var c in current_paraseries[cps]) {
							para_resistance += current_paraseries[cps][c].resistance || 0;
							current_paraseries[cps][c].seriesSum = current_paraseries[cps].slice(0);
						}
						// once this is finished, we can calculate the total resistance and
						// amperage for this branch, then recursively solve the components'
						// voltage
						console.log("Series Resistance is: " + para_resistance);
						para_amps = cluster_voltage / para_resistance;
						console.log("The amperage is: " + para_amps);
						calc_current_volt(current_paraseries[cps], para_amps, 0);
					}
					
					// finally, having gone through this process for every branch in the
					// parallel cluster, we can remove this virtual component from the
					// series sum of every single component in powered, now that it's been
					// satisfactorily calculated
					for(pp = 0; pp < powered.length; pp ++) {
						current_series = powered[pp].seriesSum;
						for(cs = 0; cs < current_series.length; cs ++) {
							if(current_series[cs] != powered[pp] && current_series[cs] == break_up) {
								current_series.splice(cs, 1);
								cs --;
							}

						}
					}
					
					break_up = 0;
				}
      }
      // this is used for edge cases where there's only one
      // component in the circuit, besides the battery
      else if(powered.length == 1) {
				powered[p].current = amps;
				powered[p].setVoltage(amps * powered[p].resistance);
				console.log("No pop of break");
      }
    }
    // as for this little detail, basically here because I don't trust
    // this function to run recursively for as long as necessary.
    if(!complete && counter < 10) {
      console.log(counter);
      calc_current_volt(powered, amps, counter);
    }
    console.log("finished");
    return;
  };
  
  equal_series_sum = function(input, output) {
    
    var input_series = input.seriesSum;
    var output_series = output.seriesSum;
    
    var unique = true;
    
    if(input_series.length == output_series.length) {
      for(var i in input_series) {
				unique = true;
				for(var o in output_series) {
					if(input_series[i] == output_series[o]) {
						unique = false;
					}
				}
				if(unique === true)
				break;
      }
    }
    return !unique;
    
  };
  
  this.killSimulation = function() {
		
		for (var c in this.components) {
		  this.components[c].on_off = false;
		  this.components[c].simulate_flag = false;
		}
    this.simulating = false;
    
  };
}
