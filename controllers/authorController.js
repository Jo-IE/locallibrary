var Author = require('../models/author');
var async = require("async");
var Book = require("../models/book")
var {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter')


// Display list of all Authors.
exports.author_list = function(req, res, next) {
   Author.find()
   .exec(function(err, list_authors){
       if(err){return next(err)}
       res.render("author_list", {title:"Authors", author_list: list_authors})
   })
};

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id)
            .exec(callback)
        },
        books: function(callback){
            Book.find({"author": req.params.id})
            .exec(callback)
        },
    },
        function(err, results){
            if(err){next(err)}
            if(results.author === null){
               var err = new Error('Author not found');
            err.status = 404;
            return next(err);
            }
            res.render('author_detail', {title:results.author.name, author: results.author, book_list: results.books })
        }
    )
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', {title:'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [
    body(['first_name', 'family_name']).isLength({min:1}).trim().withMessage('Author name is required')
    .isAlphanumeric().withMessage('Only alphanumeric characters are allowed for Author name'),
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    
    body(['date_of_birth', 'date_of_death'], 'Invalid Date').optional({checkFalsy:true}).isISO8601(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    
    function(req, res, next){
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()})
            return;
        }
        
        else{
            var author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            });
            
            author.save(function(err){
                if (err){return next(err)}
                 res.redirect(author.url);
            });
        }
    }
    ];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
   
        async.parallel({
            author: function(callback){
                Author.findById(req.params.id)
                    .exec(callback)
            },
            author_books: function(callback){
                Book.find({'author': req.params.id})
                .exec(callback)
            },
            },function(err, results){
                if(err){return next(err)}
                if (results.author==null) { 
            res.redirect('/catalog/authors');}
               else{ 
                res.render('author_delete_form', {title:'Delete Author', author: results.author, author_books: results.author_books})
               }
            }
        )
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    async.parallel({
        author: function(callback) {
          Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.authors_books.length > 0) {
            
            res.render('author_delete_form', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            return;
        }
        else {
    Author.deleteOne({'_id': req.body.authorid}, function(err){
        if(err){return next(err)}
        res.redirect('/catalog/authors')
    })
        }
    }
        )
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
    Author.findById(req.params.id, function(err, result){
        if(err){return next(err)}
        if(result==null){
            var err = new Error('Author not found')
            err.status=404;
            return next(err)
        }
        res.render('author_form', {title: 'Update Author', author: result})
    })
    
};

// Handle Author update on POST.
exports.author_update_post = [
    body(['first_name', 'family_name']).isLength({min:1}).trim().withMessage('Author name is required')
    .isAlphanumeric().withMessage('Only alphanumeric characters are allowed for Author name'),
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    
    body(['date_of_birth', 'date_of_death'], 'Invalid Date').optional({checkFalsy:true}).isISO8601(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    
    function(req, res, next){
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            res.render('author_form', {title: 'Update Author', author: req.body, errors: errors.array()})
            return;
        }
        
        else{
            var author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id:req.params.id 
            });
            Author.findByIdAndUpdate(req.params.id, author, {}, function(err, updatedAuthor){
                if(err){return next(err)}
                res.redirect(updatedAuthor.url)
            })
        }
    }
    ]