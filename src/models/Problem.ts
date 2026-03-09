import mongoose, { Schema, Document } from 'mongoose';

export interface IProblem extends Document {
    title: string;
    link: string;
    platform: 'leetcode' | 'gfg' | 'codeforces' | 'other';
    difficulty: 'easy' | 'medium' | 'hard';
    categories: string[];
    code: string;
    language: string;
    notes: string;
    status: 'solved' | 'attempted' | 'todo';
    isFavorite: boolean;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ProblemSchema = new Schema<IProblem>(
    {
        title: { type: String, required: true, trim: true },
        link: { type: String, required: true, trim: true },
        platform: {
            type: String,
            enum: ['leetcode', 'gfg', 'codeforces', 'other'],
            default: 'leetcode',
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            required: true,
        },
        categories: [{ type: String, trim: true }],
        code: { type: String, default: '' },
        language: { type: String, default: 'cpp' },
        notes: { type: String, default: '' },
        status: {
            type: String,
            enum: ['solved', 'attempted', 'todo'],
            default: 'solved',
        },
        isFavorite: { type: Boolean, default: false },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

// Explicitly set language_override so MongoDB doesn't mistake our 'language' field for the text search language
ProblemSchema.index({ title: 'text', notes: 'text' }, { language_override: 'textSearchLanguage' });
ProblemSchema.index({ categories: 1 });
ProblemSchema.index({ difficulty: 1 });
ProblemSchema.index({ status: 1 });

if (mongoose.models.Problem) {
    delete mongoose.models.Problem;
}

export default mongoose.model<IProblem>('Problem', ProblemSchema);
