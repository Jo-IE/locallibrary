var BookInstance = require('../models/bookinstance');
var Book = require("../models/book")
var async = require("async")
const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter')

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate("book")
    .exec(function(err, bookinstances){
        if (err){return next(err)}
        res.render("bookinstance_list", {title:"Book Instances", bookinstance_list: bookinstances })
    })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
            BookInstance.findById(req.params.id)
            .populate("book")
            .exec(function(err, book_instance){
                if(err){return next(err)}
                if (book_instance==null) { 
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
                }
                res.render("bookinstance_detail", {book:book_instance.book, instance:book_instance })
            })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    async.parallel({
        books: function(callback){
            Book.find(callback)
        },
        
    }, function(err, results){
        if(err){return next(err)}
        res.render('bookinstance_form', {title: 'Create a New Book Instance', book_list: results.books} )
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    
     //validate fields
     body('book', 'Book is a required field').isLength({min:1}).trim(),
     body('imprint').isLength({min:1}).trim().withMessage('Imprint is a required field')
     .isAlphanumeric().withMessage('Only alphanumeric characters are permitted for imprint'),
     body('due_back').isLength({min:1}).trim().withMessage('Date when book available is a required field'),
    
    //sanitize fields
    sanitizeBody('*').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    function(req, res, next){
        const errors = validationResult(req);
        var bookinstance = new BookInstance({
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            })
            
        if(!errors.isEmpty()){
            Book.find({}, 'title')
            .exec(function(err, books){
                if(err){return next(err)}
                res.render('bookinstance_form', {title:'Create a New Book Instance', errors:errors.array(), book_list: books, selected_book: bookinstance.book._id, bookinstance:bookinstance})
            })
        }
        else{
            
            bookinstance.save(function(err){
                if(err){return next(err)}
                res.redirect(bookinstance.url)
            })
        }
    }
    
    ]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
   BookInstance.findById(req.params.id)
   .populate('book')
   .exec(function(err, results){
       if (err){return next(err)}
       if(results==null){
           var err = new Error('Book Instance not found');
           err.status = 404;
           return next(err);
       }
       res.render('bookinstance_delete_form', {title: 'Delete Book Instance', bookinstance: results})
   })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.deleteOne({'_id': req.body.bookinstanceid}, function(err){
        if (err){return next(err)}
        res.redirect('/catalog/bookinstances')
    })
  
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        books: function(callback){
            Book.find(callback)
        },
        bookinstance: function(callback){
             BookInstance.findById(req.params.id)
             .populate('book')
             .exec(callback)
        }
    }, function(err, result){
        if(err){return next(err)}
        res.render('bookinstance_form', {title: 'Update Book Instance', bookinstance: result.bookinstance, book_list: result.books})
    })
   
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    //validate fields
     body('book', 'Book is a required field').isLength({min:1}).trim(),
     body('imprint').isLength({min:1}).trim().withMessage('Imprint is a required field')
     .isAlphanumeric().withMessage('Only alphanumeric characters are permitted for imprint'),
     body('due_back').isLength({min:1}).trim().withMessage('Date when book available is a required field'),
    
    //sanitize fields
    sanitizeBody('*').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    function(req, res, next){
        const errors = validationResult(req);
        var bookinstance = new BookInstance({
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            })
            
        if(!errors.isEmpty()){
            Book.find({}, 'title')
            .exec(function(err, books){
                if(err){return next(err)}
                res.render('bookinstance_form', {title:'Update Book Instance', errors:errors.array(), book_list: books, selected_book: bookinstance.book._id, bookinstance:bookinstance})
            })
        }
        else{
            
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, updatedInstance){
                if(err){return next(err)}
                res.redirect(updatedInstance.url)
            })
        }
    }
    
    ]