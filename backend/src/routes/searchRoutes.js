const express = require('express');
const { validateSearch } = require('../middleware/validateSearch');
const { search } = require('../controllers/searchController');

const router = express.Router();

router.get('/search', validateSearch, search);

module.exports = router;
