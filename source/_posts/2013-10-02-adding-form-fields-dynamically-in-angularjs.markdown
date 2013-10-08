---
layout: post
title: "Adding Form Fields Dynamically in AngularJS"
date: 2013-10-02 09:22
comments: true
categories: angularjs
footer: true

---

Once of the first challenges I encountered with building [NOMinatr](http://nominatr.com) on AngularJS was figuring out how to dynamically add new form fields. Polls in NOMinatr needed to be able to allow users to add as many different options as they want and not be constrained by some arbitrary number based on the number of fields I created beforehand. So how does one go about setting this up in AngularJS? Turns out, it's a lot simplier than you'd think. 

<!-- more -->

<img src="{{ root_url }}/images/posts/2013-10-03-nominatr-choices.jpg" />

This is the div that repeats for each text field associated with a choice on the Create a Poll page (excluding styling syntax). 

    <div class="form-group" data-ng-repeat="choice in choices">
      <label for="choice" ng-show="showChoiceLabel(choice)">Choices</label>
      <button ng-show="showAddChoice(choice)" ng-click="addNewChoice()">Add another choice</button>
      <input type="text" ng-model="choice.name" name="{{ choice.id }}" placeholder="Enter a restaurant name">
    </div>
    
The magic really happens with this ng-repeat attribute on the first line: 

    data-ng-repeat="choice in choices"
    
ng-repeat tells Angular that this &lt;div&gt; should be repeated for each of the items in the "choices" object. "choices" is defined in my controller as simply an array of objects: 

    $scope.choices = [{id: 'choice1'}, {id: 'choice2'}, {id: 'choice3'}];
    
When you click "Add another choice", it triggers runs the addNewChoice() function, which is defined as: 

    $scope.addNewChoice = function() {
      var newItemNo = $scope.choices.length+1;
      $scope.choices.push({'id':'choice'+newItemNo});
    };
    
This will create a new object with a unique id and append it to the $scope.choices object. Because of the magical 2-way binding in Angular, this is as far as you need to go! Once the new object gets appended to the array, Angular will take care of updating the DOM and appending the new text box. 

You might be wondering about that **Add another choice** button. It's in that div that gets repeated, yet it doesn't show up next to each text box. ng-show will only display the button if the function being passed into it returns true. The function in ng-show, showAddChoice(), looks like this: 

    $scope.showAddChoice = function(choice) {
      return choice.id === $scope.choices[$scope.choices.length-1].id;
    };
    
Basically, it'll only return true when the id matches the id of the last item in the $scope.choices array. 

And there you have it. That's all you need to dynamically add more fields to a form in AngularJS. Got a better implementation of it? Leave a comment below!