
import mongoose from 'mongoose';

const savedArticleSchema = mongoose.Schema(
  {
    
    user: {
      type: mongoose.Schema.Types.ObjectId, 
      required: true,                      
      ref: 'User',                         
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
      unique: false, 
    },
    sourceName: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    originalContent: {
      type: String,
      required: true,
    },
    summarizedContent: {
      type: String,
      required: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, 
  }
);


savedArticleSchema.index({ user: 1, url: 1 }, { unique: true });

const SavedArticle = mongoose.model('SavedArticle', savedArticleSchema);

export default SavedArticle;
