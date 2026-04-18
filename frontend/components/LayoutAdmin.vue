<template>
  <div class="admin-layout">
    <!-- Navbar ชั้นที่ 1 -->
    <nav class="navbar-top">
      <div class="navbar-container grid navbar-top-container">
        <div class="brand area-left">
          <div class="logo">
            <img src="/images/Logo.jpg" alt="Logo">
          </div>
          <div class="navbar-title">
            <h1 class="navbar-title-text">มหาวิทยาลัยแม่ฟ้าหลวง</h1>
            <p class="navbar-subtitle-text">ระบบบริหารจัดการโรงอาหาร</p>
          </div>
        </div>
        <div class="user-actions area-right">
          <AdminNotificationDropdown />
          <div class="user-profile" @click="toggleUserMenu">
            <div class="avatar">{{ displayInitials }}</div>
            <span class="username">{{ displayName }}</span>
            <span class="caret">▾</span>
            <div class="user-menu" v-if="showUserMenu">
              <div class="menu-item" @click="openWelcomeEditModal">
                <i class="fas fa-edit menu-icon"></i>
                <span class="menu-text">แก้ไข Welcome Page</span>
              </div>
              <div class="menu-item" @click="openBannerManagement">
                <i class="fas fa-image menu-icon"></i>
                <span class="menu-text">จัดการแบนเนอร์</span>
              </div>
              <div class="menu-divider"></div>
              <div class="menu-item logout-item" @click="handleLogout">
                <i class="fas fa-sign-out-alt menu-icon"></i>
                <span class="menu-text">ออกจากระบบ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Navbar ชั้นที่ 2 -->
    <nav class="navbar-bottom">
      <div class="navbar-container">
        <input type="checkbox" id="mobile-admin-nav-toggle" class="mobile-nav-toggle" />
        <label for="mobile-admin-nav-toggle" class="mobile-nav-button" aria-label="Toggle navigation">
          <span class="hamburger-lines" aria-hidden="true"></span>
        </label>
        <ul class="nav-list">
          <li><router-link to="/admin" class="nav-link" active-class="active">หน้าแรก</router-link></li>
          <li><router-link to="/admin/management" class="nav-link" active-class="active">การจัดการ</router-link></li>
          <li><router-link to="/admin/ranking" class="nav-link" active-class="active">จัดอันดับ</router-link></li>
          <li><router-link to="/admin/repair" class="nav-link" active-class="active">แจ้งซ่อม</router-link></li>
          <li><router-link to="/admin/leave" class="nav-link" active-class="active">แจ้งลา</router-link></li>
          <li><router-link to="/admin/bill" class="nav-link" active-class="active">บิล</router-link></li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="admin-main">
      <button class="guide-fab" type="button" @click="showGuidePopup = true">
        <i class="fas fa-comments"></i>
        <span>แนะนำการใช้งาน</span>
      </button>
      <slot></slot>
    </main>

    <div v-if="showGuidePopup" class="guide-popup-overlay" @click="showGuidePopup = false">
      <div class="guide-popup-card" @click.stop>
        <div class="guide-popup-header">
          <div class="guide-avatar">U</div>
          <div>
            <h3>คู่มือการใช้งาน</h3>
            <p>{{ currentGuide.title }}</p>
          </div>
          <button class="guide-close-btn" type="button" @click="showGuidePopup = false" aria-label="close guide">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="guide-popup-content">
          <div class="guide-message">
            <p>{{ currentGuide.overview }}</p>
          </div>

          <div class="guide-section" v-if="currentGuide.mainMenus && currentGuide.mainMenus.length">
            <h4>เมนูหลัก</h4>
            <ul class="guide-list">
              <li v-for="(item, index) in currentGuide.mainMenus" :key="`${$route.path}-menu-${index}`">{{ item }}</li>
            </ul>
          </div>

          <div class="guide-section" v-if="currentGuide.steps && currentGuide.steps.length">
            <h4>ขั้นตอนการใช้งาน</h4>
            <ol class="guide-steps">
              <li v-for="(step, index) in currentGuide.steps" :key="`${$route.path}-step-${index}`">{{ step }}</li>
            </ol>
          </div>

          <div class="guide-section" v-if="currentGuide.features && currentGuide.features.length">
            <h4>ฟังก์ชันสำคัญ</h4>
            <ul class="guide-list">
              <li v-for="(feature, index) in currentGuide.features" :key="`${$route.path}-feature-${index}`">{{ feature }}</li>
            </ul>
          </div>

          <div class="guide-section" v-if="currentGuide.scoring && currentGuide.scoring.length">
            <h4>การคำนวณและการแปลผล</h4>
            <ul class="guide-list">
              <li v-for="(item, index) in currentGuide.scoring" :key="`${$route.path}-scoring-${index}`">{{ item }}</li>
            </ul>
          </div>

          <div class="guide-section" v-if="currentGuide.filters && currentGuide.filters.length">
            <h4>การค้นหาและกรองข้อมูล</h4>
            <ul class="guide-list">
              <li v-for="(item, index) in currentGuide.filters" :key="`${$route.path}-filter-${index}`">{{ item }}</li>
            </ul>
          </div>

          <div class="guide-section" v-if="currentGuide.notes && currentGuide.notes.length">
            <h4>ข้อแนะนำสำคัญ</h4>
            <ul class="guide-list">
              <li v-for="(note, index) in currentGuide.notes" :key="`${$route.path}-note-${index}`">{{ note }}</li>
            </ul>
          </div>
        </div>

        <div class="guide-popup-actions">
          <button class="guide-btn-secondary" type="button" @click="showGuidePopup = false">ปิด</button>
          <button class="guide-btn-primary" type="button" @click="showGuidePopup = false">เข้าใจแล้ว</button>
        </div>
      </div>
    </div>

    <!-- Welcome Page Edit Modal -->
    <div v-if="showWelcomeEditModal" class="modal-overlay" @click="closeWelcomeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>แก้ไข Welcome Page</h3>
          <button class="close-btn" @click="closeWelcomeEditModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>อัปโหลดรูปภาพใหม่:</label>
            <input 
              type="file" 
              ref="imageInput"
              @change="handleImageUpload"
              accept="image/*"
              class="file-input"
            />
          </div>
          
          <div v-if="selectedImage" class="image-preview">
            <h4>รูปภาพที่เลือก:</h4>
            <div class="preview-container">
              <img :src="selectedImagePreview" alt="Preview" class="preview-image" />
              <div class="crop-controls">
                <button @click="startCrop" class="crop-btn">
                  <i class="fas fa-crop"></i>
                  ตัดรูป
                </button>
              </div>
            </div>
          </div>

          <div v-if="showCropModal" class="crop-modal">
            <div class="crop-container">
              <div class="crop-area" ref="cropArea">
                <img :src="selectedImagePreview" ref="cropImage" class="crop-image" />
                <div class="crop-overlay" ref="cropOverlay"></div>
              </div>
              <div class="crop-actions">
                <button @click="cancelCrop" class="btn btn-secondary">ยกเลิก</button>
                <button @click="applyCrop" class="btn btn-primary">ยืนยัน</button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="closeWelcomeEditModal" class="btn btn-secondary">ยกเลิก</button>
            <button @click="saveWelcomePage" class="btn btn-primary" :disabled="!selectedImage">
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="admin-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">ติดต่อเรา</h3>
          <div class="contact-info">
            <div class="contact-item">
              <i class="fas fa-building"></i>
              <span>ศูนย์อาหารมหาวิทยาลัยแม่ฟ้าหลวง (Mfu Food Court)</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>Chiang Rai, Thailand, Chiang Rai</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-phone"></i>
              <span>053 917 144</span>
            </div>
          </div>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">ติดตาม</h3>
          <div class="social-links">
            <a href="https://asset.mfu.ac.th/asset-home.html" 
               class="social-link" 
               title="สำนักงานจัดการทรัพย์สินและรายได้"
               target="_blank">
              <i class="fas fa-university"></i>
              <span>สำนักงานจัดการทรัพย์สินและรายได้</span>
            </a>
            <a href="https://www.facebook.com/MFUFOODCOURT" 
               class="social-link facebook" 
               target="_blank">
              <i class="fab fa-facebook-f"></i>
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import AdminNotificationDropdown from './AdminNotificationDropdown.vue'

export default {
  name: 'LayoutAdmin',
  components: {
    AdminNotificationDropdown
  },
  data() {
    return {
      showUserMenu: false,
      displayName: sessionStorage.getItem('displayName') || 'Admin User',
      showGuidePopup: false,
      showWelcomeEditModal: false,
      selectedImage: null,
      selectedImagePreview: null,
      showCropModal: false,
      cropData: null
    }
  },
  computed: {
    displayInitials() {
      const parts = (this.displayName || '').trim().split(' ')
      const initials = parts.filter(Boolean).slice(0, 2).map(p => p[0]).join('')
      return initials || 'A'
    },
    currentGuide() {
      const guidesByRoute = {
        '/admin': {
          title: 'คู่มือการใช้งานหน้าแรกผู้ดูแล',
          overview: 'หน้านี้เป็นหน้าภาพรวมของระบบผู้ดูแล ใช้ตรวจสอบข้อมูลสำคัญล่าสุดก่อนเข้าไปจัดการในแต่ละเมนู',
          steps: [
            'ตรวจสอบความเคลื่อนไหวล่าสุดจากแบนเนอร์และข่าว',
            'คลิกเมนูด้านบนเพื่อเข้าสู่หน้าจัดการที่ต้องการ',
            'กลับมาตรวจสอบหน้าแรกอีกครั้งหลังแก้ไขข้อมูลสำคัญ'
          ],
          notes: [
            'ใช้หน้านี้เป็นจุดเริ่มงานประจำวัน',
            'ควรตรวจความถูกต้องของข้อมูลก่อนส่งต่อให้ผู้ใช้รับทราบ'
          ]
        },
        '/admin/management': {
          title: 'คู่มือการใช้งานหน้าการจัดการ',
          overview: 'หน้านี้ใช้จัดการข้อมูลหลักของร้านค้าและรายการที่เกี่ยวข้องกับการแสดงผลในระบบ',
          steps: [
            'เลือกรายการที่ต้องการแก้ไขจากตารางหรือเมนูย่อย',
            'อัปเดตข้อมูลให้ครบถ้วนตามแบบฟอร์ม',
            'บันทึกข้อมูลและตรวจสอบผลลัพธ์บนหน้าที่ผู้ใช้มองเห็นจริง'
          ],
          notes: [
            'ควรอัปเดตข้อมูลที่กระทบผู้ใช้จำนวนมากก่อน',
            'ตรวจสอบความถูกต้องก่อนบันทึกทุกครั้ง'
          ]
        },
        '/admin/ranking': {
          title: 'คู่มือการใช้งานระบบประเมินร้านค้า (Ranking System)',
          overview: 'ระบบนี้ใช้สำหรับประเมินและจัดอันดับร้านค้า โดยผู้ใช้งานสามารถกำหนดหัวข้อประเมิน ให้คะแนนร้านค้า ตรวจสอบผลย้อนหลัง และส่งออกข้อมูลผลการประเมิน',
          mainMenus: [
            'Control (ตัวควบคุม)',
            'Add Topic (เพิ่มหัวข้อ)',
            'View Topic (ดูหัวข้อ)',
            'Evaluation (ทำแบบประเมิน)',
            'History (ประวัติย้อนหลัง)'
          ],
          steps: [
            'นำเข้าข้อมูลรายได้: กดปุ่ม Import Excel แล้วอัปโหลดไฟล์ .xlsx, .xls หรือ .csv ขนาดไม่เกิน 10MB จากนั้นตรวจสอบว่าข้อมูลรายได้ของแต่ละร้านถูกต้อง',
            'จัดการหัวข้อประเมิน: ไปที่เมนู Add Topic หรือ View Topic เพื่อเพิ่มหัวข้อ กำหนดคะแนนเต็ม และแก้ไขหรือลบหัวข้อเมื่อจำเป็น',
            'เปิดระบบประเมิน: ไปที่เมนู Control แล้วเปิดสวิตช์ระบบประเมิน เพื่อเริ่มรอบการประเมินของช่วงเวลาที่ต้องการ',
            'ทำแบบประเมินร้านค้า: ไปที่เมนู Evaluation เลือกร้านที่ต้องการ กดประเมินสำหรับร้านใหม่ หรือกดแก้ไขสำหรับร้านที่เคยประเมินแล้ว จากนั้นกรอกคะแนนตามหัวข้อ',
            'ตรวจสอบผลการประเมิน: ไปที่เมนู History เพื่อตรวจคะแนนรวม สถานะผ่านหรือไม่ผ่าน และเปิดดูรายละเอียดรายข้อย้อนหลัง',
            'ส่งออกข้อมูล: Export เป็นไฟล์ CSV เพื่อนำไปใช้รายงานหรือส่งให้ผู้เกี่ยวข้อง'
          ],
          features: [
            'Control: ดูสถานะร้าน เสร็จแล้วหรือรอดำเนินการ เปิดหรือปิดระบบประเมิน และรีเซ็ตคะแนนทั้งหมด',
            'Add Topic: เพิ่มหัวข้อประเมินใหม่ พร้อมชื่อ คำอธิบาย และคะแนนเต็ม',
            'View Topic: ดูหัวข้อทั้งหมด ดูคะแนนรวม และจัดการแก้ไขหรือลบหัวข้อ',
            'Evaluation: ให้คะแนนร้านค้าและแก้ไขคะแนนย้อนหลัง',
            'History: ดูผลประเมินย้อนหลัง ตรวจสถานะผ่านหรือไม่ผ่าน และดูรายละเอียดแต่ละรอบ'
          ],
          scoring: [
            'ระบบจะรวมคะแนนจากทุกหัวข้อที่กำหนดไว้',
            'คะแนนรวมจะถูกเปรียบเทียบกับคะแนนเต็มรวม',
            'ผลลัพธ์จะแสดงเป็นสถานะผ่านหรือไม่ผ่าน'
          ],
          filters: [
            'ค้นหาชื่อร้าน',
            'กรองตามโรงอาหารและหมวดหมู่',
            'เรียงคะแนนจากมากไปน้อยหรือจากน้อยไปมาก',
            'ใช้การแบ่งหน้าเพื่อดูข้อมูลจำนวนมาก'
          ],
          notes: [
            'ควร Import รายได้ก่อนทุกครั้งก่อนเริ่มประเมิน',
            'ตรวจสอบหัวข้อให้ตรงกับรอบประเมินปัจจุบัน',
            'เปิดระบบก่อนเริ่มให้คะแนน',
            'ตรวจสอบผลใน History ก่อน Export ทุกครั้ง'
          ]
        },
        '/admin/repair': {
          title: 'คู่มือการใช้งานหน้าแจ้งซ่อม',
          overview: 'หน้านี้ใช้สำหรับรับงานแจ้งซ่อม ติดตามความคืบหน้า และปิดงานเมื่อแก้ไขเสร็จ',
          steps: [
            'เปิดรายการแจ้งซ่อมและตรวจสอบรายละเอียดปัญหา',
            'จัดลำดับความสำคัญตามผลกระทบและความเร่งด่วน',
            'อัปเดตสถานะงานทุกครั้งเมื่อมีความคืบหน้า',
            'บันทึกผลการแก้ไขและปิดงานเมื่อดำเนินการเรียบร้อย'
          ],
          notes: [
            'งานที่กระทบการใช้งานหลักควรดำเนินการก่อน',
            'ควรบันทึกรายละเอียดการแก้ไขเพื่อใช้อ้างอิงย้อนหลัง'
          ]
        },
        '/admin/leave': {
          title: 'คู่มือการใช้งานหน้าแจ้งลา',
          overview: 'หน้านี้ใช้สำหรับตรวจสอบและอนุมัติคำขอลาให้เป็นไปตามขั้นตอนที่ชัดเจน',
          steps: [
            'ตรวจสอบชื่อผู้ยื่น วันที่ลา และเหตุผลการลา',
            'พิจารณาคำขอจากข้อมูลที่ครบถ้วน',
            'อนุมัติหรือปฏิเสธพร้อมบันทึกผลการพิจารณา',
            'แจ้งผลให้ผู้ยื่นรับทราบตามเวลา'
          ],
          notes: [
            'หากข้อมูลไม่ครบควรติดต่อผู้ยื่นก่อนตัดสินใจ',
            'ควรพิจารณาคำขอภายในระยะเวลาที่กำหนด'
          ]
        },
        '/admin/bill': {
          title: 'คู่มือการใช้งานหน้าบิล',
          overview: 'หน้านี้ใช้ตรวจสอบรายการบิล รายรับรายจ่าย และความถูกต้องของยอดรวม',
          steps: [
            'เลือกช่วงเวลาที่ต้องการตรวจสอบข้อมูลบิล',
            'ตรวจยอดรวมและเทียบกับรายละเอียดแต่ละรายการ',
            'ตรวจสอบความผิดปกติและแก้ไขข้อมูลหากจำเป็น',
            'บันทึกหรือส่งออกข้อมูลเพื่อเก็บเป็นหลักฐาน'
          ],
          notes: [
            'ควรตรวจความสอดคล้องของจำนวนรายการกับยอดรวมทุกครั้ง',
            'เมื่อพบข้อมูลผิดปกติควรตรวจซ้ำก่อนสรุปผล'
          ]
        },
        '/admin/banner': {
          title: 'คู่มือการใช้งานหน้าจัดการแบนเนอร์',
          overview: 'หน้านี้ใช้เพิ่ม แก้ไข เปิดหรือปิดการใช้งานแบนเนอร์ที่จะแสดงให้ผู้ใช้เห็นในหน้าแรก',
          steps: [
            'กรอกชื่อแบนเนอร์และลิงก์ปลายทางถ้ามี',
            'อัปโหลดภาพแบนเนอร์ที่ต้องการใช้งาน',
            'กดบันทึกเพื่อเพิ่มแบนเนอร์เข้าสู่ระบบ',
            'จัดการสถานะเปิดหรือปิดของแต่ละแบนเนอร์',
            'ตรวจสอบหน้าแสดงผลจริงหลังอัปเดต'
          ],
          notes: [
            'ควรใช้ภาพที่อ่านง่ายทั้งมือถือและคอมพิวเตอร์',
            'ตรวจสอบความถูกต้องของลิงก์ก่อนเปิดใช้งาน'
          ]
        },
        '/admin/news': {
          title: 'คู่มือการใช้งานหน้าจัดการข่าว',
          overview: 'หน้านี้ใช้เผยแพร่และจัดการข่าวสารหรือประกาศให้ผู้ใช้รับทราบอย่างถูกต้องและทันเวลา',
          steps: [
            'สร้างข่าวใหม่โดยกรอกหัวข้อและรายละเอียดให้ครบ',
            'ตรวจสอบวันเวลาและเนื้อหาก่อนเผยแพร่',
            'เผยแพร่ข่าวเมื่อพร้อมใช้งาน',
            'แก้ไขหรือปิดการแสดงผลข่าวที่หมดอายุ'
          ],
          notes: [
            'หัวข้อข่าวควรสั้น ชัดเจน และตรงประเด็น',
            'ควรทบทวนเนื้อหาก่อนเผยแพร่ทุกครั้ง'
          ]
        },
        '/admin/background': {
          title: 'คู่มือการใช้งานหน้าพื้นหลังระบบ',
          overview: 'หน้านี้ใช้เปลี่ยนภาพพื้นหลังของระบบเพื่อให้ภาพรวมหน้าใช้งานสอดคล้องกับแบรนด์และยังอ่านข้อมูลได้ชัด',
          steps: [
            'เลือกภาพพื้นหลังที่ต้องการใช้งาน',
            'อัปโหลดและบันทึกการเปลี่ยนแปลง',
            'ตรวจสอบการแสดงผลบนหลายขนาดหน้าจอ',
            'ยืนยันว่าข้อความและปุ่มยังอ่านง่ายหลังเปลี่ยนภาพ'
          ],
          notes: [
            'เลือกภาพที่ไม่รบกวนการอ่านเนื้อหาหลัก',
            'ควรทดสอบทั้งบนมือถือและเดสก์ท็อป'
          ]
        },
        '/admin/evaluation': {
          title: 'คู่มือการใช้งานหน้าผลประเมิน',
          overview: 'หน้านี้ใช้วิเคราะห์ผลคะแนนและความคิดเห็นจากผู้ใช้ เพื่อวางแผนพัฒนาคุณภาพการให้บริการ',
          steps: [
            'เลือกช่วงข้อมูลที่ต้องการวิเคราะห์',
            'ตรวจสอบคะแนนเฉลี่ยและหัวข้อที่คะแนนต่ำ',
            'อ่านข้อเสนอแนะของผู้ใช้ประกอบการตัดสินใจ',
            'วางแผนปรับปรุงและติดตามผลในรอบถัดไป'
          ],
          notes: [
            'ควรให้ความสำคัญกับหัวข้อที่คะแนนต่ำก่อน',
            'ใช้ข้อมูลทั้งเชิงปริมาณและเชิงความคิดเห็นร่วมกัน'
          ]
        }
      }
      return guidesByRoute[this.$route.path] || {
        title: 'คู่มือการใช้งานหน้านี้',
        overview: 'หน้านี้ใช้สำหรับดูและจัดการข้อมูลของระบบ กรุณาตรวจสอบความถูกต้องก่อนบันทึกทุกครั้ง',
        steps: [
          'ตรวจสอบข้อมูลก่อนเริ่มแก้ไข',
          'บันทึกหลังแก้ไขเสร็จในแต่ละส่วน',
          'ตรวจผลลัพธ์ที่แสดงบนหน้าจออีกครั้ง'
        ],
        notes: [
          'หากข้อมูลไม่อัปเดตให้รีเฟรชหน้า',
          'ควรบันทึกงานเป็นระยะเพื่อลดการสูญหายของข้อมูล'
        ]
      }
    }
  },
  methods: {
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },
    async handleLogout() {
      try {
        // เรียก backend logout API
        const { $axios } = useNuxtApp()
        if ($axios) {
          try {
            await $axios.post('/api/auth/logout', {}, {
              withCredentials: true
            })
            console.log('✅ Backend logout successful')
          } catch (error) {
            // แม้ backend logout จะล้มเหลว ก็ยังต้อง clear frontend data
            console.warn('⚠️ Backend logout failed, but continuing with frontend cleanup:', error.message)
          }
        }
      } catch (error) {
        console.warn('⚠️ Logout API call failed:', error.message)
      } finally {
        // Clear all session data
        if (process.client) {
          sessionStorage.clear()
          localStorage.clear()
          
          // Clear cookies
          document.cookie = 'user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          
          console.log('✅ Logged out successfully, cleared all session data')
        }
        this.showUserMenu = false // ปิด user menu
        this.$router.push('/login')
      }
    },
    checkAuth() {
      if (process.client) {
        const isAuthenticated = sessionStorage.getItem('isAuthenticated')
        const userRole = sessionStorage.getItem('userRole')
        // ตรวจสอบว่าอยู่ในหน้า admin หรือไม่ ถ้าไม่ใช่ให้ผ่าน
        if (this.$route.path.startsWith('/admin') && (!isAuthenticated || userRole !== 'admin')) {
          this.$router.push('/login')
        }
      }
    },
    openWelcomeEditModal() {
      this.showWelcomeEditModal = true
      this.showUserMenu = false // ปิด user menu
    },
    openBannerManagement() {
      this.showUserMenu = false // ปิด user menu
      // ไปที่หน้า banner management
      this.$router.push('/admin/banner')
    },
    closeWelcomeEditModal() {
      this.showWelcomeEditModal = false
      this.selectedImage = null
      this.selectedImagePreview = null
      this.showCropModal = false
      this.cropData = null
    },
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectedImage = file
        const reader = new FileReader()
        reader.onload = (e) => {
          this.selectedImagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    startCrop() {
      this.showCropModal = true
      this.$nextTick(() => {
        this.initCrop()
      })
    },
    initCrop() {
      // Simple crop implementation
      const cropArea = this.$refs.cropArea
      const cropOverlay = this.$refs.cropOverlay
      
      if (cropArea && cropOverlay) {
        cropOverlay.style.position = 'absolute'
        cropOverlay.style.top = '10%'
        cropOverlay.style.left = '10%'
        cropOverlay.style.width = '80%'
        cropOverlay.style.height = '80%'
        cropOverlay.style.border = '2px dashed #fff'
        cropOverlay.style.backgroundColor = 'rgba(0,0,0,0.3)'
        cropOverlay.style.cursor = 'move'
      }
    },
    cancelCrop() {
      this.showCropModal = false
    },
    applyCrop() {
      // Simple crop implementation - in real app, use a proper crop library
      this.showCropModal = false
      alert('การตัดรูปเสร็จสิ้น (ในเวอร์ชันจริงจะใช้ library สำหรับ crop)')
    },
    async saveWelcomePage() {
      if (!this.selectedImage) return
      
      try {
        const formData = new FormData()
        formData.append('image', this.selectedImage)
        
        // ใช้ axios interceptor (validate token อัตโนมัติ)
        console.log('Sending request with validated token')
        
        const response = await this.$axios.post('/api/welcome/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.data.success) {
          alert('บันทึก Welcome Page สำเร็จ!')
          this.closeWelcomeEditModal()
          // รีเฟรชหน้าเพื่อแสดงรูปภาพใหม่
          window.location.reload()
        } else {
          alert('เกิดข้อผิดพลาด: ' + (response.data.error || 'ไม่ทราบสาเหตุ'))
        }
      } catch (error) {
        console.error('Error saving welcome page:', error)
        
        let errorMessage = 'เกิดข้อผิดพลาดในการบันทึก'
        
        if (error.response) {
          // Server responded with error status
          const status = error.response.status
          const data = error.response.data
          
          if (status === 401) {
            errorMessage = 'กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุ)'
          } else if (status === 403) {
            errorMessage = 'คุณไม่มีสิทธิ์ในการแก้ไข (ต้องเป็น Admin)'
          } else if (status === 400) {
            errorMessage = 'ข้อมูลไม่ถูกต้อง: ' + (data.error || 'กรุณาตรวจสอบไฟล์')
          } else if (status === 500) {
            errorMessage = 'เกิดข้อผิดพลาดในระบบ: ' + (data.error || 'ไม่ทราบสาเหตุ')
          } else {
            errorMessage = `เกิดข้อผิดพลาด (${status}): ` + (data.error || 'ไม่ทราบสาเหตุ')
          }
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
        } else {
          // Something else happened
          errorMessage = 'เกิดข้อผิดพลาด: ' + error.message
        }
        
        alert(errorMessage)
      }
    }
  },
  mounted() {
    this.checkAuth()
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800;900&family=Inter:wght@400;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar ชั้นที่ 1 */
.navbar-top {
  background-color: white;
  padding: 6px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-top-container {
  max-width: none;
  margin: 0;
  padding: 0 var(--page-padding);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--page-padding);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Make top and bottom nav stretch edge-to-edge */
.navbar-top .navbar-container {
  max-width: none;
  margin: 0;
  padding: 0 var(--page-padding);
}

.navbar-container.grid {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}

.area-left { justify-self: start; }
.area-center { justify-self: center; }
.area-right { justify-self: end; }

.logo img { height: clamp(44px, 10vw, 72px); width: auto; }

.brand {
  display: flex;
  align-items: center;
  gap: var(--gap);
}

.navbar-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 2px;
}

.navbar-title-text {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 800;
  color: #111827;
  font-family: 'Kanit', 'Noto Sans Thai', sans-serif;
  line-height: 1.1;
}

.navbar-subtitle-text {
  margin: 0;
  font-size: var(--font-md);
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  font-family: 'Kanit', 'Noto Sans Thai', sans-serif;
  align-self: center;
  text-align: center;
  line-height: 1.1;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: var(--gap);
}

.notification {
  position: relative;
  cursor: pointer;
}

.notification-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: var(--font-sm);
}

.user-profile {
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #111827;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-sm);
}

.caret {
  color: #6b7280;
  font-size: var(--font-sm);
}

.username {
  font-weight: 600;
  color: #111827;
  font-size: var(--font-md);
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  padding: 8px 0;
  border: 1px solid #e2e8f0;
  z-index: 1000;
  margin-top: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
}

.menu-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.menu-item.logout-item {
  color: #dc2626;
}

.menu-item.logout-item:hover {
  background: #fef2f2;
  color: #b91c1c;
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  font-size: var(--font-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-text {
  font-size: var(--font-md);
  font-weight: 500;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

/* Navbar ชั้นที่ 2 */
.navbar-bottom {
  background-color: #e74c3c;
  padding: 6px 0;
}

.navbar-bottom .navbar-container {
  max-width: none;
  padding: 0 12px;
}

.mobile-nav-toggle {
  display: none;
}

.mobile-nav-button {
  display: none;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  justify-content: space-evenly;
}

.nav-list li {
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  text-align: center;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.nav-link:hover {
  background: rgba(255,255,255,0.15);
  transform: translateY(-1px);
}

.nav-link.active {
  background: rgba(255,255,255,0.25);
}

/* Mobile navigation (hamburger) */
@media (max-width: 768px) {
  .navbar-top {
    padding: 4px 0;
  }

  .navbar-top .navbar-container {
    padding: 0 10px;
    column-gap: 8px;
  }

  .brand {
    gap: 8px;
    min-width: 0;
  }

  .logo img {
    height: clamp(34px, 8.5vw, 46px);
  }

  .navbar-title {
    min-width: 0;
  }

  .navbar-title-text {
    font-size: clamp(0.78rem, 3.1vw, 0.92rem);
    line-height: 1.2;
  }

  .navbar-subtitle-text {
    font-size: clamp(0.58rem, 2.2vw, 0.7rem);
    letter-spacing: 0.03em;
    align-self: flex-start;
    text-align: left;
    line-height: 1.15;
  }

  .user-actions {
    gap: 6px;
  }

  .user-profile {
    gap: 4px;
    min-width: 0;
    max-width: min(46vw, 200px);
  }

  .username {
    font-size: clamp(0.65rem, 2.6vw, 0.78rem);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .avatar {
    width: 28px;
    height: 28px;
    font-size: clamp(0.6rem, 2.2vw, 0.72rem);
    flex-shrink: 0;
  }

  .caret {
    flex-shrink: 0;
    font-size: 0.65rem;
  }

  .navbar-bottom .navbar-container {
    position: relative;
    padding: 0 16px;
  }

  .mobile-nav-button {
    display: flex;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.15);
    cursor: pointer;
  }

  .hamburger-lines {
    width: 22px;
    height: 2px;
    background: #fff;
    position: relative;
    display: block;
  }
  .hamburger-lines::before,
  .hamburger-lines::after {
    content: '';
    position: absolute;
    left: 0;
    width: 22px;
    height: 2px;
    background: #fff;
  }
  .hamburger-lines::before { top: -7px; }
  .hamburger-lines::after { top: 7px; }

  .nav-list {
    display: none;
    flex-direction: column;
    justify-content: flex-start;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #e74c3c;
    padding: 8px 0;
    border-radius: 0 0 12px 12px;
    z-index: 1000;
  }

  .nav-list li {
    justify-content: flex-start;
    width: 100%;
  }

  .nav-link {
    width: 100%;
    padding: 12px 16px;
    text-align: left;
    min-height: 44px;
  }

  /* checkbox hack: show menu when checked */
  .mobile-nav-toggle:checked ~ .nav-list {
    display: flex;
  }
}

/* Main Content */
.admin-main {
  flex: 1;
  padding: var(--page-padding);
  background-color: #f5f6fa;
  position: relative;
}

.guide-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1001;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.35);
}

.guide-fab:hover {
  transform: translateY(-1px);
}

.guide-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.guide-popup-card {
  width: min(560px, 100%);
  max-height: 86vh;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #dbeafe;
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.28);
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.guide-popup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.guide-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #1d4ed8;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.guide-popup-header h3 {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
}

.guide-popup-header p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}

.guide-close-btn {
  margin-left: auto;
  border: none;
  background: #f1f5f9;
  color: #475569;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
}

.guide-message {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.guide-message p {
  margin: 0;
  color: #1e3a8a;
  font-size: 14px;
  line-height: 1.55;
}

.guide-popup-content {
  overflow-y: auto;
  padding-right: 4px;
}

.guide-list {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  font-size: 14px;
  line-height: 1.5;
}

.guide-list li + li {
  margin-top: 6px;
}

.guide-section {
  margin-top: 12px;
}

.guide-section h4 {
  margin: 0 0 6px;
  font-size: 14px;
  color: #0f172a;
}

.guide-steps {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  font-size: 14px;
  line-height: 1.5;
}

.guide-steps li + li {
  margin-top: 6px;
}

.guide-popup-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.guide-btn-secondary,
.guide-btn-primary {
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.guide-btn-secondary {
  background: #e2e8f0;
  color: #334155;
}

.guide-btn-primary {
  background: #1d4ed8;
  color: #fff;
}

/* Footer */
.admin-footer {
  background-color: #e74c3c;
  color: white;
  padding: var(--spacing-lg) var(--page-padding);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  text-align: center;
}

.footer-section {
  flex: 1;
}

.footer-title {
  font-size: clamp(14px, 3.5vw, 20px);
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  color: white;
  font-family: 'Kanit', sans-serif;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  align-items: center;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: var(--gap);
  font-size: var(--font-md);
  line-height: 1.5;
}

.contact-item span {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.contact-item i {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-md);
  color: #ffd700;
  flex-shrink: 0;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  align-items: center;
}

.social-link {
  display: flex;
  align-items: center;
  gap: var(--gap);
  color: white;
  text-decoration: none;
  font-size: var(--font-md);
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  min-height: 44px;
}

.social-link span {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.social-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.social-link.facebook:hover {
  background-color: #1877f2;
  border-color: #1877f2;
}

.social-link i {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-md);
  color: #ffd700;
  flex-shrink: 0;
}

.social-link.facebook i {
  color: #1877f2;
}

.social-link.facebook:hover i {
  color: white;
}


/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #2d3748;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
}

.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  background: #f7fafc;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-input:hover {
  border-color: #667eea;
  background: #edf2f7;
}

.image-preview {
  margin-top: 20px;
}

.image-preview h4 {
  margin-bottom: 12px;
  color: #2d3748;
}

.preview-container {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.crop-controls {
  margin-top: 12px;
}

.crop-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.crop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.crop-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
}

.crop-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 80vw;
  max-height: 80vh;
}

.crop-area {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.crop-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
}

.crop-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .preview-image {
    max-width: 100%;
  }
  
  .user-menu {
    min-width: 200px;
  }
  
  .menu-item {
    padding: 10px 14px;
  }
  
  .menu-text {
    font-size: 13px;
  }

  .admin-footer {
    padding: 16px 12px;
  }

  .guide-fab {
    right: 12px;
    bottom: 12px;
    border-radius: 14px;
    width: calc(100% - 24px);
    justify-content: center;
  }

  .guide-popup-card {
    padding: 14px;
    border-radius: 14px;
    max-height: 90vh;
  }

  .guide-message p,
  .guide-list,
  .guide-steps {
    font-size: 13px;
  }

  .footer-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
    text-align: left;
    justify-content: stretch;
    max-width: 960px;
  }

  .footer-section {
    min-width: 0;
  }

  .footer-title {
    font-size: clamp(12px, 3.2vw, 14px);
    font-weight: 700;
    margin: 0 0 8px 0;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.28);
  }

  .contact-info,
  .social-links {
    align-items: stretch;
  }

  .contact-item,
  .social-link {
    align-items: flex-start;
    font-size: clamp(11px, 2.8vw, 13px);
    line-height: 1.45;
    margin-bottom: 6px;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    min-height: auto;
    gap: 6px;
  }

  .contact-item i,
  .social-link i {
    width: 16px;
    height: 16px;
    font-size: 13px;
    margin-top: 2px;
  }
}
</style>
