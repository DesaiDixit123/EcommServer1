import { $productModel } from "../models/productsModel.js";
import { Rating } from "../models/ratingModel.js";
export const addRating = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.verifyTokenId;

    // Check if the user has already rated this product
    const existingRating = await Rating.findOne({ productId, userId });

    if (existingRating) {
      // Update the existing rating
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();

      // Recalculate average rating
      const ratings = await Rating.find({ productId });
      const averageRating = ratings.length
        ? ratings.reduce((total, rating) => total + rating.rating, 0) / ratings.length
        : 0;

      await $productModel.findByIdAndUpdate(productId, { averageRating });

      return res.status(200).json({ message: 'Rating updated successfully' });
    }

    // Create a new rating
    const newRating = new Rating({
      productId,
      userId,
      rating,
      comment,
    });

    await newRating.save(); // Save the new rating first

    // Fetch updated ratings after saving the new rating
    const ratings = await Rating.find({ productId });
    const averageRating = ratings.length
      ? ratings.reduce((total, rating) => total + rating.rating, 0) / ratings.length
      : 0;

    // Update the product's average rating
    await $productModel.findByIdAndUpdate(productId, { averageRating });

    res.status(201).json({ message: 'Rating added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.', error });
  }
};

export const getRatingsForProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const ratings = await Rating.find({ productId })
        .populate("userId", "fname lname username email_id profileImg");
  
      res.status(200).json(ratings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    
    }
}


export const getAverageRating = async (req, res) => {
    try {
        const { productId } = req.params;

        const ratings = await Rating.find({ productId });
        const averageRating =
          ratings.reduce((total, rating) => total + rating.rating, 0) /
          ratings.length;
    
        res.status(200).json({ averageRating: averageRating || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}