var Book = require('../models/book');
var Author = require("../models/author")
var Genre = require("../models/genre")
var BookInstance = require("../models/bookinstance")
var async = require("async")
var {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter')

/*console.log(Author)
console.log(Book)
console.log(Genre)
console.log(BookInstance)*/

exports.index = function(req, res) {
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); 
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {
    Book.find({}, "title author")
    .populate("author")
    .exec(function(err, list_books){
        if(err){return next(err)}
        res.render("book_list", {title: "Book List", book_list:list_books})
    })
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {
   async.parallel({
       book_name: function(callback){
           Book.findById(req.params.id)
           .populate("author")
           .populate("genre")
           .exec(callback)
       },
       book_instances: function(callback){
           BookInstance.find({"book": req.params.id})
           .exec(callback)
       },
   },
       function(err, results){
           if(err){return next(err)}
           if(results.book_name === null){
               throw new Error("Book not Found")
           }
           res.render("book_detail", {title: "Book Detail", book_name: results.book_name, book_instance: results.book_instances})
       }
   )
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
    async.parallel({
        author: function(callback){
            Author.find(callback)
        },
        genre: function(callback){
            Genre.find(callback)
        },
    },
        function(err, results){
            if (err){return next(err)}
             res.render('book_form', {title: 'Create New Book', authors: results.author, genres: results.genre});
        }
    )
   
};

// Handle book create on POST.
exports.book_create_post = [
    (req, res, next) =>{
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined'){
                req.body.genre = [];
            }
            else {
                req.body.genre = new Array(req.body.genre)
            }
        }
        next()
    },
    //validate fields
     body('title').isLength({min:1}).trim().withMessage('A title is required')
     .isAlphanumeric().withMessage('Only alphanumeric characters are allowed for Title'),
     
     body('summary').isLength({min:1}).trim().withMessage('Summary field is required')
     .isAlphanumeric().withMessage('Only alphanumeric characters are allowed for Summary'),
     
     body('isbn').isLength({min:1}).trim().withMessage('ISBN is required')
     .isAlphanumeric().withMessage('Only alphanumeric characters are allowed for ISBN'),
     
     body('author').isLength({min:1}).trim().withMessage('Author name is required')
     .isAlphanumeric().withMessage('Only alphanumeric characters are allowed for Title'),
     
     
     //sanitize fields
     sanitizeBody("*").escape(),
     
     (req, res, next) =>{
         const errors = validationResult(req)
         
         var book = new Book({
             title: req.body.title,
             author: req.body.author,
             summary: req.body.summary,
             isbn: req.body.isbn,
             genre: req.body.genre
         })
         if(!errors.isEmpty()){
             async.parallel({
                 authors: function(callback){
                     Author.find(callback)
                 },
                 genres: function(callback){
                     Genre.find(callback)
                 },
             },
                 function(err, result){
                     if(err){return next(err)}
                     for(let i =0; i<result.genres.length; i++){
                         if(body.genre.indexOf(result.genres[i]._id) > -1){
                             result.genres[i].checked = 'true'
                         }
                     }
                     res.render('book_form', {title: 'Create New Book', authors: result.authors, genres: result.genres, book: book, errors: errors.array()})
                 }
             )
         }else{
                 book.save(function(err){
                     if(err){return next(err)}
                         res.redirect(book.url)
                 })
             }
     }
     
     
    ]
// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
            .populate('author')
            .exec(callback)
        },
        bookinstances: function(callback){
            BookInstance.find({'book': req.params.id})
            .exec(callback)
        }
    }, function(err, results){
        if(err){return next(err)}
        if(results.book==null){
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_delete_form', {title: 'Delete Book', book: results.book, bookinstances: results.bookinstances})
    })
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.body.bookid).exec(callback)
        },
        bookinstances: function(callback){
            BookInstance.find({'book': req.body.bookid})
            .exec(callback)
        },
    }, function(err, results){
        if(err){return next(err)}
        
        if(results.bookinstances.length > 0){
            res.render('book_delete_form', {title: 'Delete Book', book: results.book, bookinstances: results.bookinstances})
        }
        else{
            Book.deleteOne({'_id': req.body.bookid}, function(err){
                if(err){return next(err)}
                res.redirect('/catalog/books')
            })
        }
    })
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
            .exec(callback)
        },
        authors: function(callback){
            Author.find(callback)
        },
        genres: function(callback){
            Genre.find(callback)
        }
    }, function(err, results){
        if(err){return next(err)}
        if(results.book == null){
            var err = new Error('Book not found')
            err.status = 404;
            return next(err)
        }
        for(let i = 0; i<results.genres.length; i++){
            if(results.book.genre.indexOf(results.genres[i]._id.toString()) > -1){
                results.genres[i].checked = 'true';
            }
        }
        res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book })
    })
};

// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },
   
    // Validate fields.
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebook.url);
                });
        }
    }
];