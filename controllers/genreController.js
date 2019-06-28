var Genre = require('../models/genre');
var Book = require("../models/book");
var async = require("async");
var {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter')

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
    .exec(function(err, genres){
        if (err){next(err)}
        
        res.render("genre_list", {title:"Genres", genre_list: genres})
        
    })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre_name: function(callback){
            Genre.findById(req.params.id)
            .exec(callback)
        },
        book_list: function(callback){
            Book.find({'genre': req.params.id})
            .exec(callback)
        },
        
    },
    function(err, results){
        if (err) { return next(err); }
        if (results.genre_name==null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail', {title: "Genre Detail", genre: results.genre_name, list_books: results.book_list})
        }
    
)

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next){
    res.render("genre_form", {title: 'Create Genre'})
}
   
// Handle Genre create on POST.
exports.genre_create_post = [
     body('name', 'Genre name required').isLength({min: 1}).trim(),
    sanitizeBody('name').escape(),
    (req, res, next) => {
        const errors = validationResult(req)
        var genre = new Genre({
            name: req.body.name
        });
        
        if (!errors.isEmpty()){
            res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()})
            return;
        }
        else{
            Genre.findOne({'name': req.body.name})
            .exec(function(err, found_genre){
                if (err) {return next(err)}
                if(found_genre){
                res.redirect(found_genre.url)
                }
                else{
                    genre.save(function(err){
                        if(err){return next(err)}
                        res.redirect(genre.url)
                    })
                }
            })
        }
    }

    ]

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id)
            .exec(callback)
        },
        books: function(callback){
            Book.find({'genre': req.params.id})
            .exec(callback)
        }
    }, function(err, results){
        if(err){return next(err)}
        if(results.genre == null){
            var err = new Error('Genre not found')
            err.status = 404;
            return next(err)
        }
        res.render('genre_delete_form', {title: 'Delete Genre', genre: results.genre, genre_books: results.books})
    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.body.genreid)
            .exec(callback)
        },
        books: function(callback){
            Book.find({'genre': req.body.genreid})
            .exec(callback)
        }
    }, function(err, results){
        if(err){return next(err)}
        if(results.books.length > 0){
        res.render('genre_delete_form', {title: 'Delete Genre', genre: results.genre, genre_books: results.books})
        }
        else{
            Genre.deleteOne({'_id': req.body.genreid}, function(err){
                if(err){return next(err)}
                res.redirect('catalog/genres')
            })
        }
    })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id)
    .exec(function(err, result){
        if(err){return next(err)}
    res.render("genre_form", {title: 'Update Genre', genre: result})
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name', 'Genre name required').isLength({min: 1}).trim(),
    sanitizeBody('name').escape(),
    (req, res, next) => {
        const errors = validationResult(req)
        var genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });
        
        if (!errors.isEmpty()){
            res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()})
            return;
        }
        else{
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, updatedGenre){
                if(err){return next(err)}
                res.redirect(updatedGenre.url)
            })
        }
    }

    ]


