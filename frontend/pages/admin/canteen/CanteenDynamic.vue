<template>
  <LayoutAdmin>
    <CanteenManager
      v-if="resolvedCanteenId"
      :key="`canteen-${resolvedCanteenId}`"
      :canteen-id="resolvedCanteenId"
      :canteen-name="displayLabel"
    />
  </LayoutAdmin>
  
</template>

<script>
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import CanteenManager from '@/components/canteen/CanteenManager.vue'

export default {
  name: 'CanteenDynamic',
  components: {
    LayoutAdmin,
    CanteenManager
  },
  data() {
    return {
      canteens: [],
      currentCanteen: null,
      resolvedCanteenId: null
    }
  },
  computed: {
    displayLabel() {
      const name = this.currentCanteen?.name || this.slugToLabel(this.routeSlug)
      return name?.replace(/^โรงอาหาร\s*/u, '') || ''
    },
    routeSlug() {
      const raw = String(this.$route.params.id || '')
      // if numeric, map to slug
      const map = {
        '1': 'c5',
        '2': 'd1',
        '3': 'dormity',
        '4': 'e1',
        '5': 'e2',
        '6': 'epark',
        '7': 'msquare',
        '8': 'ruemrim',
        '9': 's2'
      }
      return map[raw] || raw.toLowerCase()
    }
  },
  created() {
    // Pre-resolve canteenId from route to avoid defaulting to 1
    this.resolvedCanteenId = this.slugToId(this.routeSlug)
    this.loadCanteens()
  },
  watch: {
    '$route.params.id'() {
      this.selectCurrentFromList()
    }
  },
  methods: {
    async loadCanteens() {
      try {
        const { data } = await this.$axios.get('/api/canteens')
        this.canteens = Array.isArray(data) ? data : []
        this.selectCurrentFromList()
      } catch (error) {
        console.error('โหลดรายการโรงอาหารล้มเหลว:', error)
        this.canteens = []
        this.currentCanteen = null
        this.resolvedCanteenId = this.slugToId(this.routeSlug)
      }
    },
    selectCurrentFromList() {
      const slug = this.routeSlug
      const found = this.canteens.find(c => (c?.path || '').toLowerCase().endsWith('/' + slug))
      this.currentCanteen = found || null
      // Prefer canteen.canteenId if provided by backend, fallback to slug map
      if (found && typeof found.canteenId === 'number') {
        this.resolvedCanteenId = found.canteenId
      } else {
        this.resolvedCanteenId = this.slugToId(slug)
      }
    },
    slugToId(slug) {
      const map = {
        c5: 1,
        d1: 2,
        dormity: 3,
        e1: 4,
        e2: 5,
        epark: 6,
        msquare: 7,
        ruemrim: 8,
        s2: 9
      }
      return map[slug] || 1
    },
    slugToLabel(slug) {
      const map = {
        c5: 'C5',
        d1: 'D1',
        dormity: 'Dormity',
        e1: 'E1',
        e2: 'E2',
        epark: 'Epark',
        msquare: 'Msquare',
        ruemrim: 'RuemRim',
        s2: 'S2'
      }
      return map[slug] || slug
    },
    formatDate(val) {
      if (!val) return '-'
      try {
        return new Date(val).toLocaleString()
      } catch(_) {
        return String(val)
      }
    }
  }
}
</script>

<style scoped>
</style>


