<template>
  <div class="student-history">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <VaProgressCircle indeterminate size="small" />
      <p class="loading-text">Đang tải lịch sử...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="history.length === 0" class="empty-state">
      <VaIcon name="event_busy" color="secondary" size="large" />
      <p class="empty-text">Chưa có lịch sử học tập</p>
    </div>

    <!-- History list -->
    <div v-else class="history-list">
      <div v-for="(item, index) in history" :key="index" class="history-item">
        <div class="history-left">
          <div class="history-icon">
            <VaIcon
              :name="item.source === 'attendance' ? 'event' : 'check_circle'"
              :color="getAttendanceColor(item.status || item.attendance || item.groupAttendace || item.attendanceStatus)"
              size="small"
            />
          </div>
          <div class="history-info">
            <div class="history-date">{{ formatDate(item.dateTime || item.date || item.dateAttendance) }}</div>
            <div class="history-classes">
              <div v-if="item.groupMain" class="history-group-main">
                <VaIcon name="school" size="12px" />
                <span class="label">Lớp chính:</span>
                <span class="value">{{ item.groupMain }}</span>
              </div>
              <div v-if="item.groupAttendance" class="history-group-attendance">
                <VaIcon name="group" size="12px" />
                <span class="label">Lớp điểm danh:</span>
                <span class="value">{{ item.groupAttendance }}</span>
              </div>
              <div v-if="!item.groupMain && !item.groupAttendance" class="history-group">
                <VaIcon name="group" size="12px" />
                {{ item.group || item.groupName || item.className || 'Chưa có lớp' }}
              </div>
            </div>
            <div class="history-teachers">
              <div v-if="item.teacher" class="teacher-item">
                <VaIcon name="person" size="small" />
                <span>{{ item.teacher }}</span>
              </div>
              <div v-if="item.subTeacher" class="teacher-item sub">
                <VaIcon name="person_outline" size="small" />
                <span>{{ item.subTeacher }}</span>
              </div>
              <div v-if="!item.teacher && !item.subTeacher" class="teacher-item">
                <VaIcon name="person" size="small" />
                <span>{{ getTeacherInfo(item) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="history-right">
          <VaChip
            :text="getAttendanceStatus(item.status || item.attendance || item.groupAttendace || item.attendanceStatus)"
            :color="getAttendanceColor(item.status || item.attendance || item.groupAttendace || item.attendanceStatus)"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useData } from '../../../stores/use-data'
import { DataSheet } from '../../../stores/data-from-sheet'

const props = defineProps({
  studentCode: {
    type: String,
    required: true,
  },
})

const store = useData()
const loading = ref(true)
const history = ref([])

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa có ngày'
  
  try {
    // Try different date formats
    let date
    
    // Format: DD/MM/YYYY
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      if (parts.length === 3) {
        // Assuming DD/MM/YYYY
        date = new Date(parts[2], parts[1] - 1, parts[0])
      }
    } 
    // Format: YYYY-MM-DD or ISO
    else if (dateString.includes('-')) {
      date = new Date(dateString)
    }
    // Timestamp
    else if (!isNaN(dateString)) {
      date = new Date(parseInt(dateString))
    }
    // Default
    else {
      date = new Date(dateString)
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Invalid date:', dateString)
      return dateString
    }
    
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch (error) {
    console.error('❌ Error formatting date:', dateString, error)
    return dateString
  }
}

// Helper functions for attendance status
const getAttendanceStatus = (status) => {
  if (!status) return 'Chưa điểm danh'

  const statusLower = status.toString().toLowerCase()
  if (
    statusLower.includes('có') ||
    statusLower.includes('present') ||
    statusLower.includes('1') ||
    statusLower.includes('dance') ||
    statusLower.includes('break')
  ) {
    return 'Có mặt'
  } else if (statusLower.includes('không') || statusLower.includes('absent') || statusLower.includes('0')) {
    return 'Vắng mặt'
  } else if (statusLower.includes('muộn') || statusLower.includes('late')) {
    return 'Đi muộn'
  }
  return status
}

const getAttendanceColor = (status) => {
  if (!status) return 'secondary'

  const statusLower = status.toString().toLowerCase()
  if (
    statusLower.includes('có') ||
    statusLower.includes('present') ||
    statusLower.includes('1') ||
    statusLower.includes('dance') ||
    statusLower.includes('break')
  ) {
    return 'success'
  } else if (statusLower.includes('không') || statusLower.includes('absent') || statusLower.includes('0')) {
    return 'danger'
  } else if (statusLower.includes('muộn') || statusLower.includes('late')) {
    return 'warning'
  }
  return 'info'
}

const getTeacherInfo = (item) => {
  return item.teacher || item.teacherName || item.teacherFullname || item.gv || 'Chưa có GV'
}

const loadHistory = async () => {
  if (!props.studentCode) return

  loading.value = true
  try {
    console.log('📖 Loading history for student:', props.studentCode)
    
    // Load both attendance detail and main attendance data
    await store.load(DataSheet.attendaceDetail, [DataSheet.attendance])
    const attendanceDetailRecords = store.allData || []
    const attendanceRecords = store.allAnotherData[0] || []
    
    console.log('📊 Total attendance detail records:', attendanceDetailRecords.length)
    console.log('📊 Total attendance records:', attendanceRecords.length)
    
    // Log sample records to see structure
    if (attendanceDetailRecords.length > 0) {
      console.log('📝 Sample attendance detail record:', attendanceDetailRecords[0])
    }
    if (attendanceRecords.length > 0) {
      console.log('📝 Sample attendance record:', attendanceRecords[0])
    }

    // Filter by student code
    const studentCodeLower = props.studentCode.toLowerCase()
    const filteredHistory = attendanceDetailRecords
      .filter((item) => {
        const itemCode = (item.code || '').toLowerCase()
        const itemStudentCode = (item.studentCode || '').toLowerCase()
        const itemStudent = (item.student || '').toLowerCase()
        
        return itemCode === studentCodeLower || 
               itemStudentCode === studentCodeLower || 
               itemStudent === studentCodeLower
      })
      .map((item) => {
        // Find matching attendance record to get teacher info
        const matchingAttendance = attendanceRecords.find((att) => {
          const attDate = att.dateTime || att.date
          const itemDate = item.dateTime || item.date
          const attGroup = (att.group || '').toLowerCase()
          const itemGroupAttendance = (item.groupAttendace || item.groupAttendance || '').toLowerCase()
          
          return attDate === itemDate && attGroup === itemGroupAttendance
        })
        
        // Merge data
        return {
          ...item,
          source: 'attendaceDetail',
          // Get teacher from attendance record if available
          teacher: matchingAttendance?.teacher || item.teacher || item.teacherName,
          subTeacher: matchingAttendance?.subTeacher || item.subTeacher,
          // Separate main group and attendance group
          groupMain: item.group || item.groupName,
          groupAttendance: item.groupAttendace || item.groupAttendance,
        }
      })

    console.log('✅ Filtered history records:', filteredHistory.length)
    
    // Log filtered data to debug
    if (filteredHistory.length > 0) {
      console.log('📋 First filtered record:', filteredHistory[0])
    }

    // Sort by date (newest first)
    filteredHistory.sort((a, b) => {
      const dateA = new Date(a.dateTime || a.date || 0)
      const dateB = new Date(b.dateTime || b.date || 0)
      return dateB - dateA
    })

    history.value = filteredHistory
  } catch (error) {
    console.error('❌ Lỗi khi tải lịch sử học tập:', error)
    history.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHistory()
})

watch(
  () => props.studentCode,
  (newCode) => {
    if (newCode) {
      loadHistory()
    }
  },
)
</script>

<style lang="scss" scoped>
.student-history {
  min-height: 200px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.loading-text {
  color: var(--va-secondary);
  font-size: 0.875rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-text {
  color: var(--va-secondary);
  margin-top: 1rem;
  font-size: 0.875rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem;
  background-color: var(--va-background-element);
  border-radius: 0.5rem;
  border: 1px solid var(--va-background-border);
  transition: all 0.2s;

  &:hover {
    background-color: var(--va-background-border);
    transform: translateX(4px);
  }

  @media (min-width: 640px) {
    padding: 1rem;
  }
}

.history-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.history-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--va-background);
  border-radius: 0.375rem;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-text-primary);
  margin-bottom: 0.375rem;

  @media (min-width: 640px) {
    font-size: 1rem;
  }
}

.history-classes {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.375rem;
}

.history-group-main,
.history-group-attendance {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;

  @media (min-width: 640px) {
    font-size: 0.8125rem;
  }

  .va-icon {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .label {
    color: var(--va-text-secondary);
    font-weight: 500;
  }

  .value {
    color: var(--va-text-primary);
    font-weight: 600;
  }
}

.history-group-main {
  .label {
    color: var(--va-primary);
  }
  .value {
    color: var(--va-primary);
  }
}

.history-group-attendance {
  .label {
    color: var(--va-info);
  }
  .value {
    color: var(--va-info);
  }
}

.history-group {
  font-size: 0.75rem;
  color: var(--va-secondary);
  display: flex;
  align-items: center;
  gap: 0.375rem;

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }

  .va-icon {
    flex-shrink: 0;
  }
}

.history-teachers {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.teacher-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--va-text-primary);

  @media (min-width: 640px) {
    font-size: 0.8125rem;
  }

  .va-icon {
    flex-shrink: 0;
    color: var(--va-success);
  }

  &.sub {
    color: var(--va-text-secondary);
    
    .va-icon {
      color: var(--va-info);
    }
  }
}

.history-right {
  flex-shrink: 0;
}
</style>
