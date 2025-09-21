import EvaluationTopic from '../models/EvaluationTopic.js'
import EvaluationItem from '../models/EvaluationItem.js'

// Get all evaluation topics
const getAllTopics = async (req, res) => {
  try {
    const topics = await EvaluationTopic.find().sort({ createdAt: -1 })
    res.json({
      success: true,
      data: topics
    })
  } catch (error) {
    console.error('Error getting evaluation topics:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหัวข้อแบบประเมิน'
    })
  }
}

// Create new evaluation topic
const createTopic = async (req, res) => {
  try {
    const { title, description, maxScore } = req.body

    if (!title || !maxScore) {
      return res.status(400).json({
        success: false,
        error: 'กรุณากรอกชื่อหัวข้อและคะแนนเต็ม'
      })
    }

    // สร้างหัวข้อใน EvaluationTopic
    const newTopic = new EvaluationTopic({
      title,
      description: description || '',
      maxScore: parseInt(maxScore)
    })

    const savedTopic = await newTopic.save()

    // สร้างหัวข้อใน EvaluationItem ด้วย
    const newItem = new EvaluationItem({
      title,
      description: description || '',
      maxScore: parseInt(maxScore),
      order: 0 // ใช้ order เริ่มต้นเป็น 0
    })

    const savedItem = await newItem.save()

    res.status(201).json({
      success: true,
      data: savedTopic,
      evaluationItem: savedItem,
      message: 'สร้างหัวข้อแบบประเมินเรียบร้อยแล้ว'
    })
  } catch (error) {
    console.error('Error creating evaluation topic:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการสร้างหัวข้อแบบประเมิน'
    })
  }
}

// Update evaluation topic
const updateTopic = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, maxScore } = req.body

    const topic = await EvaluationTopic.findById(id)
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบหัวข้อแบบประเมินที่ต้องการแก้ไข'
      })
    }

    topic.title = title || topic.title
    topic.description = description || topic.description
    topic.maxScore = maxScore ? parseInt(maxScore) : topic.maxScore

    const updatedTopic = await topic.save()

    res.json({
      success: true,
      data: updatedTopic,
      message: 'แก้ไขหัวข้อแบบประเมินเรียบร้อยแล้ว'
    })
  } catch (error) {
    console.error('Error updating evaluation topic:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการแก้ไขหัวข้อแบบประเมิน'
    })
  }
}

// Delete evaluation topic
const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params

    const topic = await EvaluationTopic.findById(id)
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบหัวข้อแบบประเมินที่ต้องการลบ'
      })
    }

    await EvaluationTopic.findByIdAndDelete(id)

    res.json({
      success: true,
      message: 'ลบหัวข้อแบบประเมินเรียบร้อยแล้ว'
    })
  } catch (error) {
    console.error('Error deleting evaluation topic:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการลบหัวข้อแบบประเมิน'
    })
  }
}

// Get topic by ID
const getTopicById = async (req, res) => {
  try {
    const { id } = req.params

    const topic = await EvaluationTopic.findById(id)
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบหัวข้อแบบประเมิน'
      })
    }

    res.json({
      success: true,
      data: topic
    })
  } catch (error) {
    console.error('Error getting evaluation topic:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหัวข้อแบบประเมิน'
    })
  }
}

export {
  getAllTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getTopicById
}
