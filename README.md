# CC-DateRangePicker
Extension of [g00fy's Angular Datepicker](https://github.com/g00fy-/angular-datepicker)

##Requirements
- Angular v1.3.13+
- UI Bootstrap v0.13.0+
- Moment JS v2.10.3+
- Bootstrap v3.3.5+

##Getting Started

###RUN

```
index.html
```

###Directive Example
```
<div date-picker-app
    date-output-format="dddd, MMM D, YYYY"
    start-placeholder-text="From Date"
    end-placeholder-text="To Date"
    max-end-date-offset="30"
    data-from-date="formData.fromDate"
    data-to-date="formData.toDate"
    view-mode="doubleDate"
    max-end-date-from-today="330"></div> 
```

----------

##Directive Attributes

#### from-date
Type: `Date`  

This is the value of the end date picked on the dateRange in ISO 8601

#### start-date
Type: `Date`  

This is the value of the start date picked on the dateRange in ISO 8601

#### date-output-format
Type: `String`  
Default: `MMM DD YYYY`

[MomentJS](http://momentjs.com/) format that is outputted by the calendar pickers

#### view-mode
Type: `String`  
Default: `doubleDate`
```
"singleDate" : one single dateRange input
"doubleDate" : two single date inputs
```

Choose between a single dateRange view or two single date inputs

#### start-placeholder-text
Type: `String`  
Default: ``

Placeholder text to place in the start input box

#### end-placeholder-text
Type: `String`  
Default: ``

Placeholder text to place in the end input box

#### min-start-date
Type: `Date`  
Default: ``

Minimum start date

#### max-start-date
Type: `Date`   
Default: ``

Maximum start Date

#### max-start-date-offset
Type: `Date`   
Default: ``

Maximum start Date relative to the 

#### min-end-date
Type: `Date`  
Default: ``

Minimum end date

#### max-end-date
Type: `Date`  
Default: ``

Maximum end Date

#### max-end-date-offset
Type: `Integer`  
Default: ``

##### NOT USED ANYMORE

#### max-end-date-from-today
Type: `Integer`  
Default: ``

Maximum end date relative to today's date

## close-delay
Type: `Integer`
Default: 1000

Number of seconds that the calendar remains open after an end-date selection

-------------

####Further optimization

1. ~~Swap $watch on the input for an ng-change~~ (swapped out a few)~~
2. ~~Change startCal toggle on/off to not update (causing an entire calendar wipe and rebuild), and instead add/remove the disabled class~~

####Todo

1. Apply validation to the input boxes
2. Comment new functions
3. ~~Add offset min/max dates~~
4. ~~Fix up-arrow for single input box~~
5. Apply validation to the directive attributes