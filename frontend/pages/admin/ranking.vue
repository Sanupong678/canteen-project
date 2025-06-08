<template>
  <layout-admin>
    <div class="contrainer">
        <H1>ข้อมูลสถิติ</H1>
    </div>
    <div class="navbar">
        <div class="contrainer_navber">
        <h3>ลำดับ</h3>
        <h3>วัน/เดือน/ปี</h3>
        <h3>ยอดขายรายเดือน</h3>
        <h3>ranking</h3>
        </div>
    </div>
  </layout-admin>
</template>

<script>
import LayoutAdmin from '../../components/LayoutAdmin.vue'
export default {
  components: { LayoutAdmin },

}
</script>

<style>
.contrainer{
    margin: auto;
    background-color:#D9D9D9;
    width: 1300px;
    height: 400px;
    display: flex;
    border-radius: 5px;
}
.contrainer_navber{
    margin: auto;
    width: 1300px;
    height: auto;
    display: flex;
    justify-content:center;
    gap: 10;
}
.contrainer_navber h3 {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: 180px;
}
</style>