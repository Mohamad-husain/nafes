import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { 
  connectAndInitDb, 
  User, 
  Topic, 
  Indicator, 
  Question, 
  UserFavorite, 
  UserAttempt, 
  UserSolvedIndicator 
} from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'nafes_science_secret_key_2026';

app.use(cors());
app.use(express.json());

// Initialize MongoDB Atlas connection
connectAndInitDb();

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'لم يتم توفير رمز المصادقة (يرجى تسجيل الدخول)' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'جلسة التصفح انتهت، يرجى تسجيل الدخول مجدداً' });
  }
};

// ======================= AUTH ROUTES =======================

// Register Student
app.post('/api/auth/register', async (req, res) => {
  try {
    const { national_id, name, password } = req.body;

    if (!national_id || !name || !password) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة (رقم الهوية، الاسم، كلمة المرور)' });
    }

    const cleanNationalId = String(national_id).trim();
    if (!/^\d{10}$/.test(cleanNationalId)) {
      return res.status(400).json({ error: 'رقم الهوية يجب أن يتكون من 10 أرقام بالضبط' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن لا تقل عن 4 خانات' });
    }

    const existing = await User.findOne({ national_id: cleanNationalId });
    if (existing) {
      return res.status(400).json({ error: 'رقم الهوية هذا مسجل بالفعل. يمكنك تسجيل الدخول مباشرة.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      national_id: cleanNationalId,
      name: name.trim(),
      password_hash: hash
    });

    const token = jwt.sign({ id: newUser._id, national_id: cleanNationalId, name: newUser.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح في MongoDB',
      token,
      user: { id: newUser._id, national_id: cleanNationalId, name: newUser.name }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الحساب' });
  }
});

// Login Student
app.post('/api/auth/login', async (req, res) => {
  try {
    const { national_id, password } = req.body;

    if (!national_id || !password) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهوية وكلمة المرور' });
    }

    const cleanNationalId = String(national_id).trim();
    const user = await User.findOne({ national_id: cleanNationalId });

    if (!user) {
      return res.status(400).json({ error: 'رقم الهوية أو كلمة المرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'رقم الهوية أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign({ id: user._id, national_id: user.national_id, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user._id, national_id: user.national_id, name: user.name }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// Profile
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب البيانات' });
  }
});

// ======================= SCIENCE API ROUTES =======================

// Get Structure
app.get('/api/science/structure', async (req, res) => {
  try {
    const topics = await Topic.find().lean();
    const indicators = await Indicator.find().lean();
    const totalQuestions = await Question.countDocuments();

    const tree = topics.map(topic => {
      const topicInds = indicators
        .filter(ind => String(ind.topic_id) === String(topic._id))
        .map(ind => ({ ...ind, id: ind._id }));
      return {
        ...topic,
        id: topic._id,
        indicators: topicInds
      };
    });

    res.json({
      totals: {
        questions: totalQuestions,
        topics: topics.length,
        indicators: indicators.length
      },
      topics: tree
    });
  } catch (err) {
    console.error('Structure Error:', err);
    res.status(500).json({ error: 'خطأ في تحميل هيكل مادة العلوم' });
  }
});

// Fetch Questions
app.post('/api/science/questions', async (req, res) => {
  try {
    const { indicator_ids, favorites_only } = req.body;
    let filter = {};

    if (favorites_only && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const favs = await UserFavorite.find({ user_id: decoded.id });
        filter._id = { $in: favs.map(f => f.question_id) };
      } catch (e) {}
    } else if (indicator_ids && indicator_ids.length > 0) {
      filter.indicator_id = { $in: indicator_ids };
    }

    const rawQuestions = await Question.find(filter)
      .populate({
        path: 'indicator_id',
        populate: { path: 'topic_id' }
      })
      .lean();

    // Randomize
    const shuffled = rawQuestions.sort(() => 0.5 - Math.random());

    const questions = shuffled.map(q => ({
      ...q,
      id: q._id,
      indicator_id: q.indicator_id?._id || q.indicator_id,
      indicator_title: q.indicator_id?.title || '',
      topic_title: q.indicator_id?.topic_id?.title || ''
    }));

    res.json({ questions });
  } catch (err) {
    console.error('Questions Error:', err);
    res.status(500).json({ error: 'خطأ في جلب الأسئلة' });
  }
});

// ======================= FAVORITES =======================

app.post('/api/favorites/toggle', authenticate, async (req, res) => {
  try {
    const { question_id } = req.body;
    if (!question_id) return res.status(400).json({ error: 'معرف السؤال مطلوب' });

    const existing = await UserFavorite.findOne({ user_id: req.user.id, question_id });

    let isFavorite = false;
    if (existing) {
      await UserFavorite.deleteOne({ _id: existing._id });
      isFavorite = false;
    } else {
      await UserFavorite.create({ user_id: req.user.id, question_id });
      isFavorite = true;
    }

    res.json({ isFavorite, message: isFavorite ? 'تمت إضافة السؤال للمفضلة ⭐' : 'تم إزالة السؤال من المفضلة' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في تبديل حالة المفضلة' });
  }
});

app.get('/api/favorites', authenticate, async (req, res) => {
  try {
    const favs = await UserFavorite.find({ user_id: req.user.id });
    res.json({ favoriteIds: favs.map(f => f.question_id) });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب المفضلة' });
  }
});

// ======================= ATTEMPTS & SOLVED =======================

app.post('/api/attempts/save', authenticate, async (req, res) => {
  try {
    const { total_questions, correct_count, incorrect_count, mastery_rate, duration_seconds, indicator_ids } = req.body;

    const attempt = await UserAttempt.create({
      user_id: req.user.id,
      total_questions,
      correct_count,
      incorrect_count,
      mastery_rate,
      duration_seconds: duration_seconds || 0
    });

    if (indicator_ids && Array.isArray(indicator_ids)) {
      for (const indId of indicator_ids) {
        await UserSolvedIndicator.updateOne(
          { user_id: req.user.id, indicator_id: indId },
          { user_id: req.user.id, indicator_id: indId },
          { upsert: true }
        );
      }
    }

    res.json({ message: 'تم حفظ نتائج التدريب بنجاح في MongoDB', attemptId: attempt._id });
  } catch (err) {
    console.error('Save Attempt Error:', err);
    res.status(500).json({ error: 'خطأ في حفظ النتائج' });
  }
});

app.get('/api/indicators/solved', authenticate, async (req, res) => {
  try {
    const rows = await UserSolvedIndicator.find({ user_id: req.user.id });
    res.json({ solvedIndicatorIds: rows.map(r => r.indicator_id) });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب المؤشرات المحلولة' });
  }
});

app.post('/api/indicators/solved', authenticate, async (req, res) => {
  try {
    const { indicator_ids } = req.body;
    if (indicator_ids && Array.isArray(indicator_ids)) {
      for (const indId of indicator_ids) {
        await UserSolvedIndicator.updateOne(
          { user_id: req.user.id, indicator_id: indId },
          { user_id: req.user.id, indicator_id: indId },
          { upsert: true }
        );
      }
    }
    res.json({ message: 'تم حفظ حالة الأفكار والمؤشرات المحلولة في MongoDB' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في حفظ المؤشرات' });
  }
});

app.delete('/api/indicators/solved', authenticate, async (req, res) => {
  try {
    await UserSolvedIndicator.deleteMany({ user_id: req.user.id });
    res.json({ message: 'تم إعادة ضبط شارات تم حلها بنجاح' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في إعادة الضبط' });
  }
});


app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const attempts = await UserAttempt.find({ user_id: req.user.id });
    const favCount = await UserFavorite.countDocuments({ user_id: req.user.id });

    const totalAttempts = attempts.length;
    const totalSolved = attempts.reduce((acc, a) => acc + a.total_questions, 0);
    const totalCorrect = attempts.reduce((acc, a) => acc + a.correct_count, 0);
    const totalIncorrect = attempts.reduce((acc, a) => acc + a.incorrect_count, 0);
    const avgMastery = totalAttempts > 0 
      ? Math.round(attempts.reduce((acc, a) => acc + a.mastery_rate, 0) / totalAttempts)
      : 0;

    res.json({
      stats: {
        total_attempts: totalAttempts,
        total_solved: totalSolved,
        total_correct: totalCorrect,
        total_incorrect: totalIncorrect,
        avg_mastery: avgMastery,
        favorites_count: favCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب إحصائيات الطالب' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Nafes Science MongoDB API Express Server running on http://localhost:${PORT}`);
});