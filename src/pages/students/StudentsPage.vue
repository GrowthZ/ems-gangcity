<template>
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="page-title">Học viên</h1>
    </div>
    <div>
      <VaButton @click="showStudentModal()"> + Thêm học viên </VaButton>
    </div>
  </div>

  <VaCard>
    <VaCardContent>
      <div>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput>
          <VaSelect v-model="selectedGroup" placeholder="Chọn lớp" :options="uniqueGroups" value-by="value" />
        </div>

        <VaDataTable
          animation="fade-in-up"
          class="va-data-table"
          :items="paginateItems"
          :columns="columns"
          :filter="filter"
          :loading="isLoading"
          :filter-method="customFilteringFn"
          no-data-html="Không có dữ liệu"
          @filtered="updateFilteredCount"
        >
          <template #cell(buoiConLai)="{ value }">
            <VaChip class="text-center" :color="getColor(value)" size="small">
              {{ value }}
            </VaChip>
          </template>
          <template #cell(status)="{ value }">
            <VaBadge :text="value" :color="getColor(value)" class="rounded" />
          </template>
          <template #cell(actions)="{ row, isExpanded, rowData }">
            <div class="flex gap-2">
              <VaButton
                icon="visibility"
                color="info"
                preset="secondary"
                size="small"
                title="Xem chi tiết"
                @click="$router.push(`/students/${rowData.code}`)"
              />
              <VaButton
                :icon="isExpanded ? 'do_not_disturb_on' : 'add_circle'"
                :color="isExpanded ? 'dànger' : 'success'"
                preset="secondary"
                size="small"
                title="Xem thông tin"
                @click="row.toggleRowDetails()"
              />
            </div>
          </template>
          <template #expandableRow="{ rowData }">
            <div class="gap-2">
              <div class="pl-2 grid md:grid-cols-2 xs:grid-cols-3 justify-between pt-2">
                <div class="grid md:grid-cols-1">
                  <div class="flex items-center pt-2">
                    <VaIcon size="small" :name="`mso-location_on`" color="primary" class="mr-2" />
                    <span>{{ rowData.location }}</span>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaIcon size="small" :name="`mso-calendar_month`" color="primary" class="mr-2" />
                    <span :class="rowData.birthday ? '' : 'opacity-70'">{{
                      rowData.birthday ? rowData.birthday : 'Chưa cập nhật'
                    }}</span>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaIcon size="small" :name="`mso-login`" color="primary" class="mr-2" />
                    <span :class="rowData.dateStart ? '' : 'opacity-70'">{{
                      rowData.dateStart ? rowData.dateStart : 'Chưa cập nhật'
                    }}</span>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaIcon size="small" :name="`mso-phone`" color="primary" class="mr-2" />
                    <button
                      :class="rowData.phoneNumber ? 'text-decoration-underline text-primary' : 'opacity-70'"
                      @click="callStudent(rowData.phoneNumber)"
                    >
                      {{ rowData.phoneNumber ? rowData.phoneNumber : 'Chưa cập nhật' }}
                    </button>
                  </div>
                </div>
                <div class="grid md:grid-cols-1">
                  <div class="flex items-center pt-2">
                    <VaButton preset="primary" color="success" class="ml-6" @click="showPayModal(rowData)">
                      <VaIcon size="medium" :name="`mso-currency_exchange`" color="success" class="mr-2" />
                      Đóng học
                    </VaButton>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaButton preset="primary" color="info" class="ml-6" @click="showUpdateLessonModal(rowData)">
                      <VaIcon size="medium" :name="`mso-swap_vert`" color="info" class="mr-2" />
                      Sửa buổi
                    </VaButton>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaButton preset="primary" class="ml-6" @click="showUpdateStudentModal(rowData)">
                      <VaIcon size="medium" :name="`mso-edit_square`" color="primary" class="mr-2" />
                      Cập nhật
                    </VaButton>
                  </div>
                </div>
              </div>
            </div>
            <VaDivider class="my-3" />
          </template>
        </VaDataTable>

        <div class="flex justify-between items-center mb-6">
          <div color="info" class="pt-3">
            Tổng số:
            <strong>{{ filteredItems.length }}</strong>
          </div>
          <div>
            <VaPagination
              v-if="isPaginationVisible"
              v-model="currentPage"
              :pages="totalPages"
              :visible-pages="3"
              buttons-preset="secondary"
              active-page-color="primary"
              gapped
              class="pagination"
            />
          </div>
        </div>
      </div>
    </VaCardContent>
  </VaCard>
  <VaModal v-slot="{ cancel, ok }" v-model="doShowPayModal" size="small" hide-default-actions>
    <PayModal
      :student-to-update="studentToUpdate"
      :is-payment-modal="isPaymentModal"
      @close="cancel"
      @save="
        (data) => {
          sendPayment(data)
          ok()
        }
      "
      @updateLesson="
        (data) => {
          sendUpdateLesson(data)
          ok()
        }
      "
    />
  </VaModal>

  <VaModal v-slot="{ cancel, ok }" v-model="doShowStudentModal" size="small" hide-default-actions mobile-fullscreen>
    <NewStudentModal
      :student-to-update="studentToUpdate"
      :locations="locations"
      :groups="groups"
      :students="items"
      @close="cancel"
      @save="
        (data) => {
          sendNewStudent(data)
          ok()
        }
      "
      @update="
        (data) => {
          console.log(data)
          sendUpdateStudent(data)
          ok()
        }
      "
    />
  </VaModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
// import { useStudentData } from './useStudentData'

import { sleep } from '../../services/utils'
import { DataSheet, showMessageBox, Action, sendRequest } from '../../stores/data-from-sheet'
import { useData } from '../../stores/use-data'
import PayModal from './components/PayModal.vue'
import NewStudentModal from './components/NewStudentModal.vue'

const filter = ref('')
const filterByFields = ref([])
const filteredCount = ref(0)
const selectedGroup = ref('')
const pageSize = 15 // Số lượng mục trên mỗi trang
const currentPage = ref(1) // Trang hiện tại
// const doShowModal = ref(false)
// const studentToEdit = (ref < import('./types').Student) | (null > null)

const store = useData()

const items = computed(() => store.allData)
const anotherData = computed(() => store.anotherData)
const isLoading = computed(() => store.loading)
const locations = ref([])
const followStudents = ref([])
const mergedData = ref([])
const groups = ref([])

const doShowPayModal = ref(false)
const isPaymentModal = ref(false)
const studentToUpdate = ref(undefined)

const doShowStudentModal = ref(false)

store.load(DataSheet.student, [DataSheet.location, DataSheet.followStudent, DataSheet.group])

watch(anotherData, (newData) => {
  if (newData) {
    locations.value = newData[0]
    followStudents.value = newData[1]
    groups.value = newData[2]
    mergedData.value = mergeArrays(items.value, followStudents.value)
    console.log('Merged Data:', mergedData.value) // Debug merged data
  }
})

const columns = [
  { key: 'actions', label: 'Thao tác' },
  { key: 'fullname', sortable: true, label: 'Tên' },
  { key: 'group', sortable: true, label: 'Lớp' },
  {
    key: 'buoiConLai',
    sortable: true,
    label: 'Buổi còn lại',
    sortMethod: (a, b) => {
      console.log(`Comparing: ${a} vs ${b}`) // Debug giá trị khi sắp xếp
      return Number(a || 0) - Number(b || 0)
    },
  },
  { key: 'status', label: 'Trạng thái' },
]

function mergeArrays(arr1, arr2) {
  return arr1.map((item1) => {
    const item2 = arr2.find((item) => item.code === item1.code)
    return {
      ...item1,
      tongSoBuoi: item2 ? parseInt(item2.tongSoBuoi) : 0,
      buoiDaHoc: item2 ? parseInt(item2.buoiDaHoc) : 0,
      buoiConLai: item2 ? parseInt(item2.buoiConLai) : 0,
    }
  })
}

const callStudent = (phone) => {
  if (!phone) return
  window.location.href = `tel:${phone}`
}

const showPayModal = (student) => {
  isPaymentModal.value = true
  studentToUpdate.value = student
  doShowPayModal.value = true
}

const showUpdateLessonModal = (student) => {
  isPaymentModal.value = false
  studentToUpdate.value = student
  doShowPayModal.value = true
}

const showStudentModal = () => {
  studentToUpdate.value = undefined
  doShowStudentModal.value = true
}

const showUpdateStudentModal = (student) => {
  studentToUpdate.value = student
  doShowStudentModal.value = true
}

const sendPayment = async (dataJson) => {
  store.loading = true
  const res = await sendRequest(Action.createPayment, dataJson)

  if (res.status == 'success') {
    // ✅ Backend trả về payment data với ID (gd0001, gd0002, ...)
    const paymentWithId = res.data
    console.log('✅ Payment created with ID:', paymentWithId?.id)

    showMessageBox(`Đóng học thành công!`, 'success')
    updateStudentLesson(dataJson)
  } else {
    showMessageBox(`Đóng học thất bại!`, 'danger')
  }
  store.loading = false
}

const sendUpdateLesson = async (dataJson) => {
  store.loading = true
  const res = await sendRequest(Action.updateLesson, dataJson)

  if (res.status == 'success') {
    showMessageBox(`Điều chỉnh thành công!`, 'success')
    updateStudentLesson(dataJson)
  } else {
    showMessageBox(`Điều chỉnh thất bại!`, 'danger')
  }
  store.loading = false
}

const sendNewStudent = async (dataJson) => {
  store.loading = true
  const res = await sendRequest(Action.newStudent, dataJson)

  if (res.status == 'success') {
    showMessageBox(`Thêm mới học sinh thành công!`, 'success')
    createNewStudent(dataJson)
  } else {
    showMessageBox(`Thêm mới học sinh thất bại!`, 'danger')
  }
  store.loading = false
}

const sendUpdateStudent = async (dataJson) => {
  store.loading = true
  const res = await sendRequest(Action.updateStudent, dataJson)

  if (res.status == 'success') {
    showMessageBox(`Cập nhật thông tin thành công!`, 'success')
    updateStudent(dataJson)
  } else {
    showMessageBox(`Cập nhật thông tin thất bại!`, 'danger')
  }
  store.loading = false
}

// const columnsWithName = columns.map((column) => {
//   return { value: column.key, text: column.label || column.key }
// })

const uniqueGroups = computed(() => {
  // Tạo danh sách các giá trị duy nhất của cột group
  const groups = new Set(items.value.map((item) => item.group))
  const uniqueGroupsArray = Array.from(groups).map((group) => ({ value: group, text: group }))
  uniqueGroupsArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueGroupsArray : []
})

const filteredItems = computed(() => {
  return mergedData.value.filter((item) => {
    const isAllSelected = selectedGroup.value === ''
    if (!isAllSelected) {
      if (item?.group !== selectedGroup.value) {
        return false
      }
    }

    // Lọc dữ liệu dựa trên filter và filterByFields
    const filterRegex = new RegExp(filter.value, 'i')
    const filterFields = filterByFields.value

    const isMatchFilter = Object.values(item).some((value) => {
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some((subValue) => filterRegex.test(subValue))
      } else {
        return filterRegex.test(String(value))
      }
    })

    const isMatchFields =
      filterFields.length === 0 ||
      filterFields.some((field) => {
        const keys = field.split('.')
        let value = item
        for (const key of keys) {
          if (!(key in value)) return false
          value = value[key]
        }
        return filterRegex.test(String(value))
      })

    return isMatchFilter && isMatchFields
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / pageSize)
})

const paginateItems = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return filteredItems.value.slice(startIndex, endIndex)
})

const customFilteringFn = (source, cellData) => {
  if (!filter.value) {
    return true
  }

  if (filterByFields.value.length >= 1) {
    const searchInCurrentRow = filterByFields.value.some((field) => cellData.column.key === field)
    if (!searchInCurrentRow) return false
  }

  const filterRegex = new RegExp(filter.value, 'i')
  currentPage.value = 1
  return filterRegex.test(source)
}

const updateFilteredCount = ({ items }) => {
  filteredCount.value = items.length
}

const isPaginationVisible = computed(() => {
  return totalPages.value > 1
})

const updateStudentLesson = (data) => {
  followStudents.value = followStudents.value.map((item) => {
    if (item.code == data.studentCode) {
      item.buoiConLai = parseInt(item.buoiConLai) + parseInt(data.lesson)
    }
    return item
  })
  mergedData.value = mergeArrays(items.value, followStudents.value)
}

const createNewStudent = (data) => {
  items.value.unshift(data)
  mergedData.value = mergeArrays(items.value, followStudents.value)
}

const updateStudent = (data) => {
  items.value = items.value.map((item) => {
    if (item.code == data.code) {
      copyProperties(item, data)
    }
    return item
  })
  mergedData.value = mergeArrays(items.value, followStudents.value)
}

const copyProperties = (target, source) => {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = source[key]
    }
  }
}
// fetchStudents()

watch(selectedGroup, () => {
  store.loading = true
  sleep(100).then(() => {
    store.loading = false
    currentPage.value = 1
  })
  // currentPage.value = 1
})

const getColor = (value) => {
  if (value > 3 || value == 'Đang học') {
    return 'success'
  } else if ((value <= 3 && value > 0) || value == 'Tạm nghỉ') {
    return 'warning'
  } else {
    return 'danger'
  }
}
</script>
<style lang="scss" scoped>
.va-data-table {
  ::v-deep(.va-data-table__table-tr) {
    border-bottom: 1px solid var(--va-background-border);
  }
}
.pagination {
  margin-top: 10px;
}

.text-decoration-underline {
  text-decoration: underline;
}
</style>
