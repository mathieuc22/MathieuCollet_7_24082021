const sequelize = require('../middleware/database')

const Post = require('../models/post')
const Comment = require('../models/comment')
const User = require('../models/user')

// Create and Save a new Posts
exports.create = (req, res) => {
  Post.create({
    ...req.body,
    authorId: req.user.id
  })
    .then(post => res.status(201).json({ post: post }))
    .catch(error => res.status(400).json({ error }));
};

// Retrieve all Posts from the database.
exports.findAll = (req, res) => {
  Post.findAll()
    .then(posts => res.status(200).json({ posts: posts }))
    .catch(error => res.status(400).json({ error }));
};

// Find a single Posts with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Post.findByPk(id, { include: [ Comment, { model: User,
    attributes: ['id'],
    through: {
      attributes: []
    } ,
    as: 'likes' } ] })
    .then(post => {
      if (post) {
        res.status(200).json({ post: post })
      } else {
        res.status(404).json({ message: `Aucun post avec l'id ${id} n'a été trouvé` })
      }
    })
    .catch(error => res.status(404).json({ error }));
};

// Update a Posts by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  const post = await Post.findByPk(id);
  if (req.user.id != post.author && !req.user.moderator) {
    res.status(403).json({ message: 'Modification non autorisée pour cet utilisateur'});
  } else {
    Post.update(req.body, { where: { id: id }
    // pour postgresql  returning: true,
    })
      .then((num, post) => {
        if (num == 1) {
          console.log(post)
          res.status(200).json({ message: post });
        } else {
          res.status(400).json({ message: `Cannot update Post with id=${id}. Maybe Post was not found or req.body is empty!` });
        }
      })
      .catch(error => res.status(500).json({ error }));
  }
};

// Delete a Post with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;
  const post = await Post.findByPk(id);
  if (req.user.id != post.author && !req.user.moderator) {
    res.status(403).json({ message: 'Modification non autorisée pour cet utilisateur'});
  } else {
    Post.destroy({ where: { id: id } })
      .then(num => {
        if (num == 1) {
          res.status(200).json({ message: `Le post id=${id} a été supprimé`});
        } else {
          res.status(400).json({ message: `Suppression du post id=${id} impossible` });
        }
      })
      .catch(error => res.status(500).json({ error }));
  }
};

// Comment a Post with the specified id in the request
exports.comment = async (req, res) => {
  const post = await Post.findByPk(req.params.id)
  post.createComment({
    text: req.body.text,
    authorId: req.user.id
  })
    .then(comment => res.status(201).json({ comment: comment }))
    .catch(error => res.status(400).json({ error }));
};

// Add like by the id in the request
exports.like = async (req, res) => {
  const post = await Post.findByPk(req.params.id)
  post.addLikes(req.user.id, { through: { selfGranted: false } })
    .then(post => res.status(200).json({ post: post }))
    .catch(error => res.status(404).json({ error }));
  };