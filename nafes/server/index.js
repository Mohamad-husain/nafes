import { createHash } from 'node:crypto';
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
  UserSolvedIndicator,
  UserSolvedQuestion
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

    const token = jwt.sign({ id: newUser._id, national_id: cleanNationalId, name: newUser.name, role: newUser.role || 'student' }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح في MongoDB',
      token,
      user: { id: newUser._id, national_id: cleanNationalId, name: newUser.name, role: newUser.role || 'student' }
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

    const role = user.role || 'student';
    const token = jwt.sign({ id: user._id, national_id: user.national_id, name: user.name, role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user._id, national_id: user.national_id, name: user.name, role }
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
    const questions = await Question.find({}, '_id indicator_id').lean();
    const totalQuestions = await Question.countDocuments();

    const indQuestionsMap = {};
    for (const q of questions) {
      const indId = String(q.indicator_id);
      if (!indQuestionsMap[indId]) indQuestionsMap[indId] = [];
      indQuestionsMap[indId].push(String(q._id));
    }

    const tree = topics.map(topic => {
      const topicInds = indicators
        .filter(ind => String(ind.topic_id) === String(topic._id))
        .map(ind => {
          const qIds = indQuestionsMap[String(ind._id)] || [];
          return {
            ...ind,
            id: ind._id,
            question_ids: qIds,
            question_count: qIds.length
          };
        });
      return {
        ...topic,
        id: topic._id,
        question_count: topicInds.reduce((sum, ind) => sum + ind.question_count, 0),
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

    // Order deterministically by _id so students resume in sequential order
    const sortedQuestions = rawQuestions.sort((a, b) => String(a._id).localeCompare(String(b._id)));

    const questions = sortedQuestions.map(q => ({
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
    const { correct_count, incorrect_count, mastery_rate, duration_seconds } = req.body;

    const actualAnsweredCount = (correct_count || 0) + (incorrect_count || 0);

    const attempt = await UserAttempt.create({
      user_id: req.user.id,
      total_questions: actualAnsweredCount, // Save strictly the number of actually answered questions!
      correct_count: correct_count || 0,
      incorrect_count: incorrect_count || 0,
      mastery_rate: mastery_rate || 0,
      duration_seconds: duration_seconds || 0
    });

    res.json({ message: 'تم حفظ نتائج التدريب بنجاح في MongoDB', attemptId: attempt._id });
  } catch (err) {
    console.error('Save Attempt Error:', err);
    res.status(500).json({ error: 'خطأ في حفظ النتائج' });
  }
});

app.get('/api/indicators/solved', authenticate, async (req, res) => {
  try {
    const solvedQuestionIds = (await UserSolvedQuestion.distinct('question_id', { user_id: req.user.id })).map(String);
    // Derive completion from question IDs, including legacy saved progress.
    const questions = await Question.find({}, '_id indicator_id').lean();
    const byIndicator = new Map();
    for (const q of questions) {
      const key = String(q.indicator_id);
      if (!byIndicator.has(key)) byIndicator.set(key, []);
      byIndicator.get(key).push(String(q._id));
    }
    const answered = new Set(solvedQuestionIds);
    res.json({
      solvedQuestionIds,
      solvedIndicatorIds: [...byIndicator].filter(([, ids]) => ids.every(id => answered.has(id))).map(([id]) => id)
    });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب المؤشرات والأسئلة المحلولة' });
  }
});

app.post('/api/indicators/solved', authenticate, async (req, res) => {
  try {
    const { question_ids } = req.body;
    if (!Array.isArray(question_ids) || question_ids.some(id => typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id))) {
      return res.status(400).json({ error: 'معرفات الأسئلة غير صالحة' });
    }
    const ids = [...new Set(question_ids.map(id => id.toLowerCase()))];
    const questions = await Question.find({ _id: { $in: ids } }, '_id').lean();
    if (questions.length !== ids.length) return res.status(400).json({ error: 'السؤال غير موجود' });
    for (const question_id of ids) {
      // Stable ID prevents duplicate inserts from concurrent tabs; existing rows remain compatible.
      const recordId = createHash('sha256').update(`${req.user.id}:${question_id}`).digest('hex').slice(0, 24);
      try {
        await UserSolvedQuestion.updateOne(
          { user_id: req.user.id, question_id },
          { $setOnInsert: { _id: recordId, user_id: req.user.id, question_id } },
          { upsert: true }
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }
    res.json({ message: 'تم حفظ حالة الأسئلة والمؤشرات المحلولة في MongoDB' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في حفظ البيانات' });
  }
});

app.delete('/api/indicators/solved', authenticate, async (req, res) => {
  try {
    await UserSolvedIndicator.deleteMany({ user_id: req.user.id });
    await UserSolvedQuestion.deleteMany({ user_id: req.user.id });
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
    const totalSolved = attempts.reduce((acc, a) => acc + ((a.correct_count || 0) + (a.incorrect_count || 0)), 0);
    const totalCorrect = attempts.reduce((acc, a) => acc + (a.correct_count || 0), 0);
    const totalIncorrect = attempts.reduce((acc, a) => acc + (a.incorrect_count || 0), 0);
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

// ======================= ADMIN ROUTES =======================

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'لم يتم توفير رمز المصادقة' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      const dbUser = await User.findById(decoded.id);
      if (!dbUser || dbUser.role !== 'admin') {
        return res.status(403).json({ error: 'غير مصرح! هذه الصفحة مخصصة للمشرفين والفرع الإداري فقط' });
      }
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'جلسة التصفح انتهت، يرجى تسجيل الدخول مجدداً' });
  }
};

app.get('/api/admin/students-stats', authenticateAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: { $ne: 'admin' } }).select('-password_hash').lean();
    const allAttempts = await UserAttempt.find().sort({ completed_at: -1 }).lean();

    let totalSystemSolved = 0;
    let totalSystemCorrect = 0;

    const studentStatsList = students.map(student => {
      const studentAttempts = allAttempts.filter(a => String(a.user_id) === String(student._id));
      const attemptsCount = studentAttempts.length;
      const totalSolved = studentAttempts.reduce((sum, a) => sum + ((a.correct_count || 0) + (a.incorrect_count || 0)), 0);
      const totalCorrect = studentAttempts.reduce((sum, a) => sum + (a.correct_count || 0), 0);
      const totalIncorrect = studentAttempts.reduce((sum, a) => sum + (a.incorrect_count || 0), 0);
      const avgMastery = attemptsCount > 0 
        ? Math.round(studentAttempts.reduce((sum, a) => sum + (a.mastery_rate || 0), 0) / attemptsCount)
        : 0;
      const lastActive = attemptsCount > 0 ? studentAttempts[0].completed_at : student.created_at;

      totalSystemSolved += totalSolved;
      totalSystemCorrect += totalCorrect;

      return {
        student_id: student._id,
        national_id: student.national_id,
        name: student.name,
        registered_at: student.created_at,
        attempts_count: attemptsCount,
        total_solved: totalSolved,
        total_correct: totalCorrect,
        total_incorrect: totalIncorrect,
        avg_mastery: avgMastery,
        last_active: lastActive,
        attempts: studentAttempts.map(att => ({
          id: att._id,
          total_questions: (att.correct_count || 0) + (att.incorrect_count || 0),
          correct_count: att.correct_count || 0,
          incorrect_count: att.incorrect_count || 0,
          mastery_rate: att.mastery_rate,
          duration_seconds: att.duration_seconds,
          completed_at: att.completed_at
        }))
      };
    });

    const systemAvgMastery = totalSystemSolved > 0 
      ? Math.round((totalSystemCorrect / totalSystemSolved) * 100) 
      : 0;

    res.json({
      overview: {
        total_students: students.length,
        total_system_solved: totalSystemSolved,
        system_avg_mastery: systemAvgMastery
      },
      students: studentStatsList
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ error: 'خطأ في جلب بيانات لوحة التحكم للمشرف' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Nafes Science MongoDB API Express Server running on http://localhost:${PORT}`);
});
