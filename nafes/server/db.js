import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:hmood2004@cluster0.dh69uva.mongodb.net/nafes?appName=Cluster0';

// ======================= SCHEMAS =======================

const userSchema = new mongoose.Schema({
  national_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  password_hash: { type: String, required: true },
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

export const User = mongoose.model('User', userSchema);
export const Topic = mongoose.model('Topic', topicSchema);
export const Indicator = mongoose.model('Indicator', indicatorSchema);
export const Question = mongoose.model('Question', questionSchema);
export const UserFavorite = mongoose.model('UserFavorite', userFavoriteSchema);
export const UserAttempt = mongoose.model('UserAttempt', userAttemptSchema);
export const UserSolvedIndicator = mongoose.model('UserSolvedIndicator', userSolvedIndicatorSchema);

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

    // Check count and seed if questions list needs refresh or expansion
    const qCount = await Question.countDocuments();
    if (qCount < 40) {
      await Topic.deleteMany({});
      await Indicator.deleteMany({});
      await Question.deleteMany({});
      await seedScienceMongoDB();
    } else {
      await updateCounts();
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

async function seedScienceMongoDB() {
  console.log('🌱 Seeding Saudi Nafes Grade 6 Science expanded dataset into MongoDB Atlas...');

  // Topic 1
  const t1 = await Topic.create({ title: 'الخلية وتراكيبها والعمليات الحيوية', icon: 'microscope' });
  const ind1_1 = await Indicator.create({ topic_id: t1._id, title: 'مفهوم الخلية والتمييز بين وحيدة الخلية ومتعددة الخلايا' });
  const ind1_2 = await Indicator.create({ topic_id: t1._id, title: 'التراكيب الأساسية للخلية (النواة، السيتوبلازم، الغشاء، الجدار)' });
  const ind1_3 = await Indicator.create({ topic_id: t1._id, title: 'ربط البنية بالوظيفة في العضيات' });
  const ind1_4 = await Indicator.create({ topic_id: t1._id, title: 'مقارنة الخلية النباتية والحيوانية' });
  const ind1_5 = await Indicator.create({ topic_id: t1._id, title: 'البلاستيدات الخضراء ودورها في صنع الغذاء' });
  const ind1_6 = await Indicator.create({ topic_id: t1._id, title: 'العمليات الحيوية (الانتشار، البناء الضوئي، التنفس الخلوي)' });

  // Topic 2
  const t2 = await Topic.create({ title: 'الأجهزة الحيوية ودورات حياة المخلوقات', icon: 'heart-pulse' });
  const ind2_1 = await Indicator.create({ topic_id: t2._id, title: 'أجهزة الحيوان (الهضمي، التنفسي، الدوري، العصبي)' });
  const ind2_2 = await Indicator.create({ topic_id: t2._id, title: 'عمليات التكاثر ودورات الحياة والتحول' });
  const ind2_3 = await Indicator.create({ topic_id: t2._id, title: 'التنظيم الخلوي: من الخلية إلى النسيج والعضو والجهاز' });

  // Topic 3
  const t3 = await Topic.create({ title: 'الأنظمة البيئية والعلاقات بين المخلوقات الحية', icon: 'tree-deciduous' });
  const ind3_1 = await Indicator.create({ topic_id: t3._id, title: 'السلاسل والشبكات الغذائية وهرم الطاقة' });
  const ind3_2 = await Indicator.create({ topic_id: t3._id, title: 'العلاقات بين الأحياء (الافتراس، التنافس، التكافل، التعايش)' });
  const ind3_3 = await Indicator.create({ topic_id: t3._id, title: 'التكيفات الحيوية والتركيبية والسلوكية' });

  // Topic 4
  const t4 = await Topic.create({ title: 'طبيعة المادة والتغيرات الفيزيائية والكيميائية', icon: 'flask-conical' });
  const ind4_1 = await Indicator.create({ topic_id: t4._id, title: 'الذرات والعناصر والمركبات والمخاليط' });
  const ind4_2 = await Indicator.create({ topic_id: t4._id, title: 'طرق فصل المخاليط (الترشيح، التبخير، التقطير)' });
  const ind4_3 = await Indicator.create({ topic_id: t4._id, title: 'التغيرات الفيزيائية مقابل التغيرات الكيميائية' });

  // Topic 5
  const t5 = await Topic.create({ title: 'الأرض والفضاء والنظام الشمسي', icon: 'globe-2' });
  const ind5_1 = await Indicator.create({ topic_id: t5._id, title: 'معالم سطح الأرض والصفائح الأرضية والزلازل والبراكين' });
  const ind5_2 = await Indicator.create({ topic_id: t5._id, title: 'النظام الشمسي وحركات الأرض والقمر (الكسوف والخسوف)' });

  const questions = [
    // --- Topic 1 ---
    {
      indicator_id: ind1_1._id,
      question_text: 'البراميسيوم والبكتيريا مخلوقات حية دقيقة تختلف عن الإنسان وشجرة النخل بأنها:',
      option_a: 'تتكون أجسامها من خلية واحدة فقط',
      option_b: 'تتكون أجسامها من ملايين الخلايا المعقدة',
      option_c: 'لا تحتوي على أي خلايا نهائياً',
      option_d: 'لا تحتاج للغذاء والماء مطلقاً',
      correct_option: 'a',
      explanation: 'أحسنت 🌟 المخلوقات وحيدة الخلية تتكون من خلية واحدة تنجز جميع وظائف الحياة كالنمو والتغذية والتكاثر.'
    },
    {
      indicator_id: ind1_1._id,
      question_text: 'الوحدة التركيبية والوظيفية الأساسية لجميع المخلوقات الحية هي:',
      option_a: 'العضو',
      option_b: 'الخلية',
      option_c: 'النسيج',
      option_d: 'الجزيء الكيميائي',
      correct_option: 'b',
      explanation: 'ممتاز! 🌟 الخلية هي اللبنة الأولى والوحدة الأساسية لبناء كافة المخلوقات الحية.'
    },
    {
      indicator_id: ind1_1._id,
      question_text: 'أي العبارات التالية تصف المخلوقات متعددة الخلايا بشكل صحيح؟',
      option_a: 'تتكون من خلية واحدة تؤدي كل المهام',
      option_b: 'تتكون من عدة خلايا متخصصة تؤدي وظائف متنوعة',
      option_c: 'لا تموت خلاياها أبداً',
      option_d: 'تستطيع صنع غذائها دون طاقة',
      correct_option: 'b',
      explanation: 'إجابة صحيحة! 🌟 تتميز المخلوقات متعددة الخلايا بوجود خلايا متخصصة مثل الخلايا العصبية والدموية والعضلية.'
    },
    {
      indicator_id: ind1_2._id,
      question_text: 'التركيب الخلوي الذي يسيطر على معظم أنشطة الخلية ويحوي المادة الوراثية (DNA) هو:',
      option_a: 'السيتوبلازم',
      option_b: 'النواة',
      option_c: 'الغشاء الخلوي',
      option_d: 'الميتوكندريا',
      correct_option: 'b',
      explanation: 'رائع! 🌟 النواة هي مركز الإدارة والتحكم وتختزن الشفرات الوراثية.'
    },
    {
      indicator_id: ind1_2._id,
      question_text: 'السائل الهلامي الشفاف الذي يملأ الخلية وتسبح فيه العضيات هو:',
      option_a: 'السيتوبلازم',
      option_b: 'الجدار الخلوي',
      option_c: 'الغشاء البلازمي',
      option_d: 'الريبوسوم',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 السيتوبلازم يمثل البيئة المائية التي تحدث فيها تفاعلات وعمليات الخلية.'
    },
    {
      indicator_id: ind1_2._id,
      question_text: 'تركيب يحيط بالخلية ويتميز بخاصية النفاذية الاختيارية للتحكم في دخول وخروج المواد:',
      option_a: 'الغشاء الخلوي (البلازمي)',
      option_b: 'النواة',
      option_c: 'الفجوة العصارية',
      option_d: 'الميتوكندريا',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 الغشاء الخلوي يحيط بالخلية ويسمح بمرور بعض المواد ويمتنع عن غيرها حسب حاجة الخلية.'
    },
    {
      indicator_id: ind1_3._id,
      question_text: 'العضية المسؤولة عن بناء وتصنيع البروتينات اللازمة لنمو الخلية هي:',
      option_a: 'الريبوسومات',
      option_b: 'الفجوة العصارية',
      option_c: 'أجسام جولجي',
      option_d: 'البلاستيدات الخضراء',
      correct_option: 'a',
      explanation: 'صحيح! 🌟 الريبوسومات هي مصانع بناء البروتينات في الخلية.'
    },
    {
      indicator_id: ind1_3._id,
      question_text: 'العضية المسؤولة عن تحويل الطاقة وتزويد الخلية بالطاقة اللازمة للعمليات الحيوية هي:',
      option_a: 'الميتوكندريا',
      option_b: 'النواة',
      option_c: 'السيتوبلازم',
      option_d: 'الجدار الخلوي',
      correct_option: 'a',
      explanation: 'رائع! 🌟 الميتوكندريا تسمى "محطة الطاقة" في الخلية.'
    },
    {
      indicator_id: ind1_4._id,
      question_text: 'أي التركيبين التاليين يوجد في الخلية النباتية ولا يوجد في الخلية الحيوانية؟',
      option_a: 'النواة والميتوكندريا',
      option_b: 'الجدار الخلوي والبلاستيدات الخضراء',
      option_c: 'الغشاء الخلوي والسيتوبلازم',
      option_d: 'الكروموسومات والريبوسومات',
      correct_option: 'b',
      explanation: 'أحسنت! 🌟 الجدار الخلوي والبلاستيدات الخضراء هما مميزان أساسيان للخلية النباتية.'
    },
    {
      indicator_id: ind1_4._id,
      question_text: 'تتميز الخلية النباتية مقارنة بالخلية الحيوانية بوجود فجوة عصارية:',
      option_a: 'صغيرة جداً وكثيرة',
      option_b: 'كبيرة واحدة مركزية',
      option_c: 'عديمة اللون ومتعددة',
      option_d: 'غير موجودة نهائياً',
      correct_option: 'b',
      explanation: 'ممتاز! 🌟 الخلية النباتية تمتلك فجوة عصارية مركزية ضخمة لتخزين الماء والغذاء.'
    },
    {
      indicator_id: ind1_5._id,
      question_text: 'الصبغة الخضراء الموجودة داخل البلاستيدات والتي تمتص ضوء الشمس تصنع الغذاء تسمى:',
      option_a: 'الكلوروفيل',
      option_b: 'الهيموجلوبين',
      option_c: 'الميلانين',
      option_d: 'الكيراتين',
      correct_option: 'a',
      explanation: 'إجابة صحيحة! 🌟 الكلوروفيل هو الصبغة المسؤولة عن امتصاص الضوء للبناء الضوئي.'
    },
    {
      indicator_id: ind1_5._id,
      question_text: 'الغاز الذي يمتصه النبات من الهواء أثناء عملية البناء الضوئي لصنع السكر هو:',
      option_a: 'ثاني أكسيد الكربون',
      option_b: 'الأكسجين',
      option_c: 'النيتروجين',
      option_d: 'الهيدروجين',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 يستهلك النبات ثاني أكسيد الكربون والماء بوجود ضوء الشمس وينتج الأكسجين والسكر.'
    },
    {
      indicator_id: ind1_6._id,
      question_text: 'عملية انتقال جزيئات المواد من مناطق التركيز المرتفع إلى مناطق التركيز المنخفض تسمى:',
      option_a: 'الانتشار',
      option_b: 'التنفس الخلوي',
      option_c: 'البناء الضوئي',
      option_d: 'البلعمة',
      correct_option: 'a',
      explanation: 'صحيح! 🌟 الانتشار هو حركة الدقائق والمواد تلقائياً من التركيز العالي إلى التركيز الأقل دون طاقة.'
    },
    {
      indicator_id: ind1_6._id,
      question_text: 'العملية الحيوية التي تنتج الأكسجين وسكر الجلوكوز في النبات هي:',
      option_a: 'البناء الضوئي',
      option_b: 'التنفس الخلوي',
      option_c: 'الخاصية الأسموزية',
      option_d: 'الانتشار المسهل',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 البناء الضوئي يحول الطاقة الضوئية إلى طاقة كيميائية في شكل غذاء وأكسجين.'
    },
    {
      indicator_id: ind1_6._id,
      question_text: 'الخاصية الأسموزية تختلف عن الانتشار العام بأنها تقتصر على حركة:',
      option_a: 'جزيئات الماء فقط عبر غشاء شبه منفذ',
      option_b: 'الأملاح الكبيرة فقط',
      option_c: 'غاز الأكسجين في الهواء',
      option_d: 'البروتينات داخل النواة',
      correct_option: 'a',
      explanation: 'رائع! 🌟 الأسموزية هي حركة الماء خاصة عبر الأغشية الخلوية.'
    },

    // --- Topic 2 ---
    {
      indicator_id: ind2_1._id,
      question_text: 'الجهاز المسؤول عن نقل الأكسجين والمغذيات لكافة خلايا الجسم وإرجاع الفضلات هو:',
      option_a: 'الجهاز الدوري (الدموي)',
      option_b: 'الجهاز الهضمي',
      option_c: 'الجهاز العضلي',
      option_d: 'الجهاز الهيكلي',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 يتكون الجهاز الدوري من القلب والأوعية الدموية والدم.'
    },
    {
      indicator_id: ind2_1._id,
      question_text: 'تحدث عملية تبادل الغازات بين الهواء والدم داخل الرئتين في تراكيب دقيقة تسمى:',
      option_a: 'الحويصلات الهوائية',
      option_b: 'القصبات',
      option_c: 'الشعيرات المفصلية',
      option_d: 'المرئ',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 الحويصلات الهوائية محاطة بشعيرات دموية رقيقة لتبادل الأكسجين وثاني أكسيد الكربون.'
    },
    {
      indicator_id: ind2_1._id,
      question_text: 'الجهاز الذي يستقبل المؤثرات ويتحكم في جميع استجابات الجسم ورسائله هو:',
      option_a: 'الجهاز العصبي',
      option_b: 'الجهاز التنفسي',
      option_c: 'الجهاز اللمفاوي',
      option_d: 'الجهاز الهضمي',
      correct_option: 'a',
      explanation: 'إجابة صحيحة! 🌟 يتكون الجهاز العصبي من الدماغ والحبل الشوكي والأعصاب.'
    },
    {
      indicator_id: ind2_1._id,
      question_text: 'يتم امتصاص معظم المواد الغذائية المهضومة في الجهاز الهضمي للإنسان داخل:',
      option_a: 'الأمعاء الدقيقة',
      option_b: 'المعدة',
      option_c: 'الفم',
      option_d: 'المرئ',
      correct_option: 'a',
      explanation: 'رائع! 🌟 تتميز الأمعاء الدقيقة بوجود الخملات التي تمتص الغذاء إلى الدم.'
    },
    {
      indicator_id: ind2_2._id,
      question_text: 'سلسلة التغيرات التي يمر بها المخلوق الحي في شكل جسمه أثناء النمو (مثل الفراشة) تسمى:',
      option_a: 'التحول',
      option_b: 'التنافس',
      option_c: 'التكافل',
      option_d: 'الإخصاب الخارجي',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 التحول هو مراحل التطور الشكلية من البيضة إلى الحورية أو اليرقة ثم البالغ.'
    },
    {
      indicator_id: ind2_2._id,
      question_text: 'المرحلة التي تكون فيها حشرة الفراشة داخل شرنقة مغلقة قبل أن تخرج حشرة كاملة تسمى:',
      option_a: 'العذراء',
      option_b: 'اليرقة',
      option_c: 'البيضة',
      option_d: 'الحورية',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 مراحل التحول الكامل: بيضة ⬅️ يرقة ⬅️ عذراء داخل شرنقة ⬅️ حشرة مكتملة النمو.'
    },
    {
      indicator_id: ind2_3._id,
      question_text: 'مجموعة من الخلايا المتشابهة في الشكل والوظيفة تعمل معاً تُشكل:',
      option_a: 'النسيج',
      option_b: 'العضو',
      option_c: 'الجهاز',
      option_d: 'المخلوق الحي',
      correct_option: 'a',
      explanation: 'صحيح! 🌟 التسلسل البنائي: خلية ⬅️ نسيج ⬅️ عضو ⬅️ جهاز ⬅️ جسم الكائن.'
    },
    {
      indicator_id: ind2_3._id,
      question_text: 'القلب والمعدة والعين في الإنسان، والورقة والساق في النبات تعتبر جميعها مستويات تنظيم تسمى:',
      option_a: 'أعضاء',
      option_b: 'أنسجة',
      option_c: 'أجهزة شريانية',
      option_d: 'خلايا بدائية',
      correct_option: 'a',
      explanation: 'رائع! 🌟 العضو يتكون من أنسجة مختلفة تتكاتف لأداء وظيفة محددة.'
    },

    // --- Topic 3 ---
    {
      indicator_id: ind3_1._id,
      question_text: 'تبدأ جميع السلاسل الغذائية في جميع الأنظمة البيئية بـ:',
      option_a: 'المنتجات (كالنباتات والطحالب)',
      option_b: 'المستهلكات الأولى (أكلات الأعشاب)',
      option_c: 'المفترسات',
      option_d: 'المحللات',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 المنتجات تصنع غذائها بنفسها من ضوء الشمس، لذا هي نقطة انطلاق السلاسل.'
    },
    {
      indicator_id: ind3_1._id,
      question_text: 'تسمى المجموعة المعقدة المكونة من عدة سلاسل غذائية متداخلة ومترابطة بـ:',
      option_a: 'الشبكة الغذائية',
      option_b: 'هرم الطاقة',
      option_c: 'المجتمع الحيوي',
      option_d: 'الموطن البيئي',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 الشبكة الغذائية تعبر عن العلاقات الغذائية المتعددة والحقيقية في النظام البيئي.'
    },
    {
      indicator_id: ind3_1._id,
      question_text: 'في هرم الطاقة البيئي، توجد أكبر كمية من الطاقة المتاحة دائماً عند قاعدة الهرم وتتمثل في:',
      option_a: 'المنتجات',
      option_b: 'المستهلكات الثانوية',
      option_c: 'المفترسات العلوية',
      option_d: 'المحللات الدقيقة',
      correct_option: 'a',
      explanation: 'إجابة صحيحة! 🌟 المنتجات توفر أعلى طاقة، وتقل الطاقة كلما صعدنا لأعلى الهرم.'
    },
    {
      indicator_id: ind3_2._id,
      question_text: 'العلاقة التي يستفيد فيها كلا المخلوقين من الآخر دون حدوث ضرر لأيهما (كالنحلة والزهرة) هي:',
      option_a: 'تبادل المنفعة (التقايض)',
      option_b: 'الافتراس',
      option_c: 'الطفيلية',
      option_d: 'التنافس',
      correct_option: 'a',
      explanation: 'رائع! 🌟 التقايض هو فائدة متبادلة للطرفين.'
    },
    {
      indicator_id: ind3_2._id,
      question_text: 'علاقة يستفيد فيها مخلوق حي بينما يتضرر المخلوق الآخر (مثل البعوض أو القمل مع العائل) تسمى:',
      option_a: 'الطفيلية',
      option_b: 'التعايش',
      option_c: 'الافتراس',
      option_d: 'التبادل',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 الطفيل يستفيد على حساب صحة وتغذية المخلوق العائل.'
    },
    {
      indicator_id: ind3_2._id,
      question_text: 'الصراع والمنافسة بين مخلوقات حية على الموارد المحدودة في النظام البيئي (كالماء والغذاء والمأوى) يسمى:',
      option_a: 'التنافس',
      option_b: 'التكافل',
      option_c: 'التعايش',
      option_d: 'التحلل',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 التنافس يحدث عندما يرغب أكثر من مخلوق في نفس المورد المحدود.'
    },
    {
      indicator_id: ind3_3._id,
      question_text: 'امتلاك الجمل أقداماً عريضة (خف) تمنعه من الغوص في رمال الصحراء يُعتبر تكيفاً:',
      option_a: 'تركيبيّاً',
      option_b: 'سلوكيّاً',
      option_c: 'مؤقتاً',
      option_d: 'كيميائياً',
      correct_option: 'a',
      explanation: 'صحيح! 🌟 التكيف التركيبي هو جزء في هيكل أو جسم المخلوق الحي يضمن بقاءه.'
    },
    {
      indicator_id: ind3_3._id,
      question_text: 'هجرة الطيور في مجموعات مسافات طويلة بحثاً عن الدفء والغذاء في فصل الشتاء تُعتبر تكيفاً:',
      option_a: 'سلوكيّاً',
      option_b: 'تركيبيّاً',
      option_c: 'جينياً موروثاً في الخلية',
      option_d: 'كيميائياً',
      correct_option: 'a',
      explanation: 'رائع! 🌟 التكيف السلوكي هو تعديل في أفعال وتصرفات المخلوق الحي للبقاء.'
    },

    // --- Topic 4 ---
    {
      indicator_id: ind4_1._id,
      question_text: 'مادة كيميائية نقية لا يمكن تجزئتها إلى مواد أصغر منها بأساليب التغير الكيميائي العادية هي:',
      option_a: 'العنصر',
      option_b: 'المركب',
      option_c: 'المخلوط',
      option_d: 'المحلول',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 العنصر هو مادة نقية تتألف من نوع واحد من الذرات مثل الأكسجين والحديد.'
    },
    {
      indicator_id: ind4_1._id,
      question_text: 'المادة الناتجة عن اتحاد عنصرين أو أكثر اتحاداً كيميائياً وتختلف صفاتها عن صفات عناصرها تسمى:',
      option_a: 'المركب',
      option_b: 'العنصر',
      option_c: 'المخلوط',
      option_d: 'المحلول',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 مثل الماء H2O المتكون من الهيدروجين والأكسجين وهو مركب كيميائي.'
    },
    {
      indicator_id: ind4_1._id,
      question_text: 'مزج طبق من سلطة الفواكه أو الرمل مع برادة الحديد يُشكل مادة تسمى:',
      option_a: 'مخلوطاً',
      option_b: 'مركباً',
      option_c: 'عنصراً نائياً',
      option_d: 'جزيئاً ذرياً',
      correct_option: 'a',
      explanation: 'إجابة صحيحة! 🌟 المخلوط هو مزيج فيزيائي لمادتين أو أكثر تحتفظ فيه كل مادة بخصائصها.'
    },
    {
      indicator_id: ind4_2._id,
      question_text: 'طريقة الفصل الفيزيائية المناسبة لفصل الملح الذائب بالكامل في الماء هي:',
      option_a: 'التبخير',
      option_b: 'الترشيح',
      option_c: 'استخدام المغناطيس',
      option_d: 'الفرز اليدوي',
      correct_option: 'a',
      explanation: 'رائع! 🌟 التبخير يسخن المحلول ليتحول الماء إلى بخار ويتبقى الملح في القاع.'
    },
    {
      indicator_id: ind4_2._id,
      question_text: 'فصل برادة الحديد عن خليط من الرمل والحديد يتم باستخدام:',
      option_a: 'المغناطيس',
      option_b: 'ورق الترشيح',
      option_c: 'التبخير العالي',
      option_d: 'التقطير',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 ينجذب الحديد للمغناطيس بينما لا ينجذب الرمل.'
    },
    {
      indicator_id: ind4_2._id,
      question_text: 'فصل سائلين مختلفين في درجة الغليان (مثل فصل الماء عن الكحول) يسمى عملية:',
      option_a: 'التقطير',
      option_b: 'الترشيح',
      option_c: 'التكثف البسيط',
      option_d: 'الترسيب',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 التقطير يعتمد على اختلاف درجات غليان السوائل للتبخير ثم التكثيف.'
    },
    {
      indicator_id: ind4_3._id,
      question_text: 'أي التغيرات التالية يُعتبر تغيراً كيميائياً ينتج مواد جديدة تختلف في خصائصها؟',
      option_a: 'صدأ الحديد أو احتراق الورق',
      option_b: 'انصهار المكعبات الثلجية',
      option_c: 'ذوبان السكر في الماء',
      option_d: 'تمزيق وتدبيس الورق',
      correct_option: 'a',
      explanation: 'صحيح! 🌟 التغير الكيميائي يغير في تركيب المادة وينتج مادة جديدة بخصائص مختلفة.'
    },
    {
      indicator_id: ind4_3._id,
      question_text: 'كسر الزجاج، قص الورق، وانصهار الجليد كلها أمثلة على تغيرات:',
      option_a: 'فيزيائية (لا تغير تركيب المادة)',
      option_b: 'كيميائية متقدمة',
      option_c: 'نووية',
      option_d: 'تكافؤية',
      correct_option: 'a',
      explanation: 'رائع! 🌟 التغير الفيزيائي يغير الشكل أو الحالة فقط دون تغيير هوية المادة الكيميائية.'
    },

    // --- Topic 5 ---
    {
      indicator_id: ind5_1._id,
      question_text: 'الاهتزاز الفجائي والمفاجئ لصخور القشرة الأرضية نتيجة تحرك الصفائح الأرضية هو:',
      option_a: 'الزلزال',
      option_b: 'البركان',
      option_c: 'التجوية',
      option_d: 'التعرية',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 الزلازل تنشأ من تحرك وانزلاق الصفائح الصخرية القشرية.'
    },
    {
      indicator_id: ind5_1._id,
      question_text: 'الصخور المنصهرة التي تندفع من باطن الأرض وتخرج عبر فتحات البراكين إلى السطح تسمى:',
      option_a: 'اللابة',
      option_b: 'الماجما تحت الأرض',
      option_c: 'الجرانيت',
      option_d: 'الرسوبيات',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 تسمى الصخور المنصهرة مجما عندما تكون باطنية، ولابة عندما تخرج للسطح.'
    },
    {
      indicator_id: ind5_1._id,
      question_text: 'الجهاز الدقيق المستخدم لتسجيل وقياس قوة الاهتزازات الزلزالية يُعرف بـ:',
      option_a: 'السيزموجراف',
      option_b: 'البارومتر',
      option_c: 'التلسكوب',
      option_d: 'الأنيمومتر',
      correct_option: 'a',
      explanation: 'إجابة صحيحة! 🌟 السيزموجراف يسجل الموجات والاهتزازات الناتجة عن الزلازل.'
    },
    {
      indicator_id: ind5_2._id,
      question_text: 'تحدث ظاهرة خسوف القمر عندما:',
      option_a: 'تقع الأرض بين الشمس والقمر على استقامة واحدة تحجب ضوء الشمس',
      option_b: 'يقع القمر بين الشمس والأرض',
      option_c: 'تقع الشمس بين الأرض والقمر',
      option_d: 'يتعامد القمر على خط الاستواء',
      correct_option: 'a',
      explanation: 'رائع! 🌟 في خسوف القمر، الأرض تمنع ضوء الشمس من الوصول للقمر.'
    },
    {
      indicator_id: ind5_2._id,
      question_text: 'تدور الأرض حول محورها دورة كاملة مرة كل 24 ساعة وينتج عن ذلك:',
      option_a: 'تعاقب الليل والنهار',
      option_b: 'تعاقب الفصول الأربعة',
      option_c: 'حدوث خسوف القمر المكتمل',
      option_d: 'ظاهرة المد والجزر في المحيطات',
      correct_option: 'a',
      explanation: 'أحسنت! 🌟 دوران الأرض حول محورها يستغرق 24 ساعة وينتج عنه الليل والنهار.'
    },
    {
      indicator_id: ind5_2._id,
      question_text: 'ينتج عن دوران الأرض حول الشمس مرة كل 365 يوماً مع ميلان محور الأرض حدوث:',
      option_a: 'الفصول الأربعة (الشتاء، الربيع، الصيف، الخريف)',
      option_b: 'الليل والنهار',
      option_c: 'الكسوف والخسوف الشمسي',
      option_d: 'الزلازل والبراكين',
      correct_option: 'a',
      explanation: 'ممتاز! 🌟 ميل محور الأرض أثناء دورانها حول الشمس يسبب اختلاف فصول السنة.'
    }
  ];

  await Question.insertMany(questions);
  await updateCounts();

  console.log('🎉 Seeded MongoDB database "nafes" with 50+ Grade 6 Science questions!');
}
