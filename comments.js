// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Path: comments.js
// Create comments object
const commentsByPostId = {};

// Path: comments.js
// Create route for GET request
app.get('/posts/:id/comments', (req, res) => {
  // Return comments by post id
  res.send(commentsByPostId[req.params.id] || []);
});

// Path: comments.js
// Create route for POST request
app.post('/posts/:id/comments', async (req, res) => {
  // Create comment id
  const commentId = randomBytes(4).toString('hex');
  // Get content from request body
  const { content } = req.body;
  // Get comments by post id
  const comments = commentsByPostId[req.params.id] || [];
  // Add new comment to comments object
  comments.push({ id: commentId, content, status: 'pending' });
  // Set comments by post id
  commentsByPostId[req.params.id] = comments;
  // Send event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });
  // Return comments by post id
  res.status(201).send(comments);
});

// Path: comments.js
// Create route for POST request
app.post('/events', async (req, res) => {
  // Get event type
  const { type, data } = req.body;
  // Check if event type is CommentModerated
  if (type === 'CommentModerated') {
    // Get comments by post id
    const comments = commentsByPostId[data.postId];
    // Get comment from comments object
    const comment = comments.find((comment) => {
      return comment.id === data.id;
    });
    // Update comment status
    comment.status = data.status;
    // Send event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'Comment