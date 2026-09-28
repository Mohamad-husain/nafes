import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:hmood2004@cluster0.dh69uva.mongodb.net/nafes?appName=Cluster0';

// ======================= SCHEMAS =======================

const userSchema = new mongoose.Schema({
  national_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  created_at: { type: Date, default: Date.now }
});

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, default: 'microscope' },
  question_count: { type: Number, default: 0 }
});

const indicatorSchema = new mongoose.Schema({
  topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  title: { type: String, required: true },
  question_count: { type: Number, default: 0 }
});

const questionSchema = new mongoose.Schema({
  indicator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Indicator', required: true },
  type: { type: String, default: 'اختيار من متعدد' },
  question_text: { type: String, required: true },
  option_a: { type: String, required: true },
  option_b: { type: String, required: true },
  option_c: { type: String, required: true },
  option_d: { type: String, required: true },
  correct_option: { type: String, required: true },
  explanation: { type: String, required: true }
});

const userFavoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  created_at: { type: Date, default: Date.now }
});

const userAttemptSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  total_questions: { type: Number, required: true },
  correct_count: { type: Number, required: true },
  incorrect_count: { type: Number, required: true },
  mastery_rate: { type: Number, required: true },
  duration_seconds: { type: Number, default: 0 },
  completed_at: { type: Date, default: Date.now }
});

const userSolvedIndicatorSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  indicator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Indicator', required: true },
  solved_at: { type: Date, default: Date.now }
});

const userSolvedQuestionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  solved_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export const Topic = mongoose.model('Topic', topicSchema);
export const Indicator = mongoose.model('Indicator', indicatorSchema);
export const Question = mongoose.model('Question', questionSchema);
export const UserFavorite = mongoose.model('UserFavorite', userFavoriteSchema);
export const UserAttempt = mongoose.model('UserAttempt', userAttemptSchema);
export const UserSolvedIndicator = mongoose.model('UserSolvedIndicator', userSolvedIndicatorSchema);
export const UserSolvedQuestion = mongoose.model('UserSolvedQuestion', userSolvedQuestionSchema);

export async function connectAndInitDb() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas database ("nafes")...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Atlas connected successfully to database: "nafes"');

    // Seed Demo User
    const existingDemo = await User.findOne({ national_id: '1000000000' });
    if (!existingDemo) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('123456', salt);
      await User.create({
        national_id: '1000000000',
        name: 'طالب تجريبي - نافس',
        password_hash: hash
      });
      console.log('✅ Created demo student account in MongoDB: 1000000000 / Pass 123456');
    }

    // Seed Demo Admin User
    const existingAdmin = await User.findOne({ national_id: '9999999999' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      await User.create({
        national_id: '9999999999',
        name: 'المشرف العام - أدمن نافس',
        password_hash: hash,
        role: 'admin'
      });
      console.log('✅ Created demo admin account in MongoDB: 9999999999 / Pass admin123');
    }

    // Check count and seed 16 weeks structure if empty
    const topicCount = await Topic.countDocuments();
    if (topicCount === 0) {
      await seedWeeksMongoDB();
    } else {
      await updateCounts();
    }

    // Fix existing attempts in MongoDB where total_questions was recorded as batch size instead of answered count
    const existingAttempts = await UserAttempt.find({});
    for (const att of existingAttempts) {
      const actualSolved = (att.correct_count || 0) + (att.incorrect_count || 0);
      if (att.total_questions !== actualSolved) {
        att.total_questions = actualSolved;
        await att.save();
      }
    }

    console.log('✨ MongoDB Database initialized & seeded cleanly.');
  } catch (err) {
    console.error('❌ MongoDB Initialization error:', err);
  }
}

async function updateCounts() {
  const indicators = await Indicator.find();
  for (const ind of indicators) {
    const qCount = await Question.countDocuments({ indicator_id: ind._id });
    ind.question_count = qCount;
    await ind.save();
  }

  const topics = await Topic.find();
  for (const top of topics) {
    const topInds = await Indicator.find({ topic_id: top._id });
    const topIndIds = topInds.map(i => i._id);
    const qCount = await Question.countDocuments({ indicator_id: { $in: topIndIds } });
    top.question_count = qCount;
    await top.save();
  }
}

async function seedWeeksMongoDB() {
  console.log('🌱 Seeding 16 Weeks structure into MongoDB Atlas...');
  const weeks = [
    'الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4',
    'الأسبوع 5', 'الأسبوع 6', 'الأسبوع 7', 'الأسبوع 8',
    'الأسبوع 9', 'الأسبوع 10', 'الأسبوع 11', 'الأسبوع 12',
    'الأسبوع 13', 'الأسبوع 14', 'الأسبوع 15', 'الأسبوع 16'
  ];

  for (const weekTitle of weeks) {
    const topic = await Topic.create({ title: weekTitle, icon: 'calendar', question_count: 0 });
    await Indicator.create({ topic_id: topic._id, title: `أسئلة ${weekTitle}`, question_count: 0 });
  }

  await updateCounts();
  console.log('🎉 16 Weeks structure initialized successfully!');
}
