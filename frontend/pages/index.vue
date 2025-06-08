<template>
  <div>
    
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  middleware: 'auth',
  mounted() {
    this.$router.push('/login')
  }
}
</script>


