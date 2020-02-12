//jshint esversion:6
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todoListDB', {useNewUrlParser: true, useUnifiedTopology: true});

const items = [];

// Might be formatted incorrectly for the schema...

const itemsSchema = new mongoose.Schema({ 
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your To-Do List!"
});

const item2 = new Item({
  name: "Add a new item by pressing the + button"
});

const item3 = new Item({
  name: "Delete items by pressing this button."
});

const defaultItems =[item1, item2, item3];


const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
  if (foundItems.length === 0) {
    Item.insertMany(defaultItems, function(err){
    if(err) {
      console.log(err);
    } else{
      console.log("All Items Added.");
    }
  });
    res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }    
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });


  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});



app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;

  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item");
      }
    });
    res.redirect("/");    
  } else {
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemID}}}, function(err, foundList) {
      if(err) {
        console.log(err);
      } else {
        console.log("Successfully deleted item from " +listName+ " list.")
        res.redirect("/" + listName);
      }
    });
  }

});


  app.get("/:customListName" , function(req, res){
  
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(!err) {
      if (!foundList) {
        // Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });

          list.save();
          res.redirect('/' + customListName);

      } else{
        // Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
