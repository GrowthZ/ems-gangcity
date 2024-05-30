// import { sleep } from "../../../services/utils"

// export type Pagination = {
//     page: number
//     perPage: number
//     total: number
// }

// export type Sorting = {
//     sortBy: string | undefined
//     sortingOrder: 'asc' | 'desc' | null
// }

// const getSortItem = (obj: any, sortBy: any) => {
//     if (sortBy === 'creation_date') {
//         return new Date(obj[sortBy])
//     }

//     return obj[sortBy]
// }

// export const getCalendars = async (calendars: [], options: Sorting & Pagination) => {
//     await sleep(1000)

//     if (options.sortBy && options.sortingOrder) {
//         calendars.sort((a:any, b:any) => {
//             a = getSortItem(a, options.sortBy!)
//             b = getSortItem(b, options.sortBy!)
//             if (a < b) {
//                 return options.sortingOrder === 'asc' ? -1 : 1
//             }
//             if (a > b) {
//                 return options.sortingOrder === 'asc' ? 1 : -1
//             }
//             return 0
//         })
//     }

//     const normalizedCalendars = calendars.slice((options.page - 1) * options.perPage, options.page * options.perPage)

//     return {
//         data: normalizedCalendars,
//         pagination: {
//             page: options.page,
//             perPage: options.perPage,
//             total: calendars.length,
//         },
//     }
// }
