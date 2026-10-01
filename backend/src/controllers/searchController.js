const { searchLabs } = require('../services/searchService');
const { ApiError } = require('../utils/errors');

function search(req, res) {
  const { searchQuery, pincode } = req.searchParams;
  const results = searchLabs({ searchQuery, pincode });

  if (results.length === 0) {
    throw new ApiError(404, 'NO_RESULTS', 'No labs are available for this test in your pincode.');
  }

  res.status(200).json({
    success: true,
    query: { search_query: searchQuery, pincode },
    count: results.length,
    results,
  });
}

module.exports = { search };
