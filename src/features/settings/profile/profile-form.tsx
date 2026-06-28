import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Check, ChevronsUpDown, Building2, MapPin, Globe, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GallerySelector } from '@/components/gallery-selector'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import api from '@/lib/axios'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENCIES, getCurrencyByCode } from '@/lib/currencies'
import { useAppDispatch } from '@/store/store'
import { setCurrency } from '@/store/currencySlice'

// Available date formats. `value` is stored in company_settings.date_format.
const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', sample: '06/14/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', sample: '14/06/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', sample: '2026-06-14' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', sample: '14-06-2026' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY', sample: '06-14-2026' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', sample: '14 Jun 2026' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY', sample: 'Jun 14, 2026' },
] as const

// Comprehensive timezone list covering all world regions
const TIMEZONES = [
  // Global/UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'Global' },

  // North America
  { value: 'America/New_York', label: 'New York (EST/EDT)', region: 'North America' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', region: 'North America' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)', region: 'North America' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', region: 'North America' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)', region: 'North America' },
  { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)', region: 'North America' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)', region: 'North America' },

  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', region: 'South America' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)', region: 'South America' },
  { value: 'America/Lima', label: 'Lima (PET)', region: 'South America' },
  { value: 'America/Bogota', label: 'Bogotá (COT)', region: 'South America' },
  { value: 'America/Caracas', label: 'Caracas (VET)', region: 'South America' },
  { value: 'America/Santiago', label: 'Santiago (CLT/CLST)', region: 'South America' },

  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)', region: 'Europe' },
  { value: 'Europe/Lisbon', label: 'Lisbon (WET/WEST)', region: 'Europe' },
  { value: 'Europe/Prague', label: 'Prague (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Budapest', label: 'Budapest (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Samara', label: 'Samara (SAMT)', region: 'Europe' },
  { value: 'Europe/Sofia', label: 'Sofia (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Bucharest', label: 'Bucharest (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Riga', label: 'Riga (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Vilnius', label: 'Vilnius (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Tallinn', label: 'Tallinn (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Volgograd', label: 'Volgograd (MSK)', region: 'Europe' },
  { value: 'Europe/Saratov', label: 'Saratov (SAMT)', region: 'Europe' },
  { value: 'Europe/Ulyanovsk', label: 'Ulyanovsk (SAMT)', region: 'Europe' },
  { value: 'Europe/Astrakhan', label: 'Astrakhan (SAMT)', region: 'Europe' },
  { value: 'Europe/Kirov', label: 'Kirov (MSK)', region: 'Europe' },
  { value: 'Europe/Saratov', label: 'Saratov (SAMT)', region: 'Europe' },

  // Middle East
  { value: 'Asia/Dubai', label: 'Dubai (GST)', region: 'Middle East' },
  { value: 'Asia/Muscat', label: 'Muscat (GST)', region: 'Middle East' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)', region: 'Middle East' },
  { value: 'Asia/Tehran', label: 'Tehran (IRST)', region: 'Middle East' },
  { value: 'Asia/Kuwait', label: 'Kuwait (AST)', region: 'Middle East' },
  { value: 'Asia/Bahrain', label: 'Bahrain (AST)', region: 'Middle East' },
  { value: 'Asia/Qatar', label: 'Qatar (AST)', region: 'Middle East' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)', region: 'Middle East' },
  { value: 'Asia/Beirut', label: 'Beirut (EET/EEST)', region: 'Middle East' },
  { value: 'Asia/Amman', label: 'Amman (EET/EEST)', region: 'Middle East' },
  { value: 'Asia/Baghdad', label: 'Baghdad (AST)', region: 'Middle East' },
  { value: 'Asia/Kabul', label: 'Kabul (AFT)', region: 'Middle East' },

  // Asia
  { value: 'Asia/Kolkata', label: 'India (IST)', region: 'Asia' },
  { value: 'Asia/Dhaka', label: 'Dhaka (BST)', region: 'Asia' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT)', region: 'Asia' },
  { value: 'Asia/Lahore', label: 'Lahore (PKT)', region: 'Asia' },
  { value: 'Asia/Kathmandu', label: 'Kathmandu (NPT)', region: 'Asia' },
  { value: 'Asia/Colombo', label: 'Colombo (IST)', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', region: 'Asia' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (ICT)', region: 'Asia' },
  { value: 'Asia/Phnom_Penh', label: 'Phnom Penh (ICT)', region: 'Asia' },
  { value: 'Asia/Vientiane', label: 'Vientiane (ICT)', region: 'Asia' },
  { value: 'Asia/Yangon', label: 'Yangon (MMT)', region: 'Asia' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', region: 'Asia' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (MYT)', region: 'Asia' },
  { value: 'Asia/Manila', label: 'Manila (PST)', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', region: 'Asia' },
  { value: 'Asia/Beijing', label: 'Beijing (CST)', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', region: 'Asia' },
  { value: 'Asia/Taipei', label: 'Taipei (TST)', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', region: 'Asia' },
  { value: 'Asia/Pyongyang', label: 'Pyongyang (KST)', region: 'Asia' },
  { value: 'Asia/Macau', label: 'Macau (CST)', region: 'Asia' },
  { value: 'Asia/Ulaanbaatar', label: 'Ulaanbaatar (ULAT)', region: 'Asia' },
  { value: 'Asia/Vladivostok', label: 'Vladivostok (VLAT)', region: 'Asia' },
  { value: 'Asia/Yekaterinburg', label: 'Yekaterinburg (YEKT)', region: 'Asia' },
  { value: 'Asia/Novosibirsk', label: 'Novosibirsk (NOVT)', region: 'Asia' },
  { value: 'Asia/Krasnoyarsk', label: 'Krasnoyarsk (KRAT)', region: 'Asia' },
  { value: 'Asia/Irkutsk', label: 'Irkutsk (IRKT)', region: 'Asia' },
  { value: 'Asia/Yakutsk', label: 'Yakutsk (YAKT)', region: 'Asia' },
  { value: 'Asia/Kamchatka', label: 'Kamchatka (PETT)', region: 'Asia' },
  { value: 'Asia/Kabul', label: 'Kabul (AFT)', region: 'Asia' },
  { value: 'Asia/Tehran', label: 'Tehran (IRST)', region: 'Asia' },
  { value: 'Asia/Dushanbe', label: 'Dushanbe (TJT)', region: 'Asia' },
  { value: 'Asia/Samarkand', label: 'Samarkand (UZT)', region: 'Asia' },
  { value: 'Asia/Tashkent', label: 'Tashkent (UZT)', region: 'Asia' },
  { value: 'Asia/Bishkek', label: 'Bishkek (KGT)', region: 'Asia' },
  { value: 'Asia/Almaty', label: 'Almaty (ALMT)', region: 'Asia' },
  { value: 'Asia/Qyzylorda', label: 'Qyzylorda (QYZT)', region: 'Asia' },
  { value: 'Asia/Oral', label: 'Oral (ORAT)', region: 'Asia' },
  { value: 'Asia/Aqtau', label: 'Aqtau (AQTT)', region: 'Asia' },
  { value: 'Asia/Atyrau', label: 'Atyrau (ORAT)', region: 'Asia' },
  { value: 'Asia/Omsk', label: 'Omsk (OMST)', region: 'Asia' },
  { value: 'Asia/Tomsk', label: 'Tomsk (KRAT)', region: 'Asia' },
  { value: 'Asia/Khandyga', label: 'Khandyga (YAKT)', region: 'Asia' },
  { value: 'Asia/Chita', label: 'Chita (YAKT)', region: 'Asia' },
  { value: 'Asia/Srednekolymsk', label: 'Srednekolymsk (MAGT)', region: 'Asia' },
  { value: 'Asia/Magadan', label: 'Magadan (MAGT)', region: 'Asia' },
  { value: 'Asia/Sakhalin', label: 'Sakhalin (SAKT)', region: 'Asia' },
  { value: 'Asia/Ust-Nera', label: 'Ust-Nera (VLAT)', region: 'Asia' },
  { value: 'Asia/Anadyr', label: 'Anadyr (ANAT)', region: 'Asia' },

  // Central Asia
  { value: 'Asia/Almaty', label: 'Almaty (ALMT)', region: 'Central Asia' },
  { value: 'Asia/Astana', label: 'Astana (AQTT)', region: 'Central Asia' },
  { value: 'Asia/Tashkent', label: 'Tashkent (UZT)', region: 'Central Asia' },
  { value: 'Asia/Bishkek', label: 'Bishkek (KGT)', region: 'Central Asia' },
  { value: 'Asia/Dushanbe', label: 'Dushanbe (TJT)', region: 'Central Asia' },
  { value: 'Asia/Ashgabat', label: 'Ashgabat (TMT)', region: 'Central Asia' },
  { value: 'Asia/Baku', label: 'Baku (AZT)', region: 'Central Asia' },
  { value: 'Asia/Tbilisi', label: 'Tbilisi (GET)', region: 'Central Asia' },
  { value: 'Asia/Yerevan', label: 'Yerevan (AMT)', region: 'Central Asia' },

  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', region: 'Africa' },
  { value: 'Africa/Casablanca', label: 'Casablanca (WET)', region: 'Africa' },
  { value: 'Africa/Algiers', label: 'Algiers (CET)', region: 'Africa' },
  { value: 'Africa/Tunis', label: 'Tunis (CET)', region: 'Africa' },
  { value: 'Africa/Tripoli', label: 'Tripoli (EET)', region: 'Africa' },
  { value: 'Africa/Khartoum', label: 'Khartoum (CAT)', region: 'Africa' },
  { value: 'Africa/Addis_Ababa', label: 'Addis Ababa (EAT)', region: 'Africa' },
  { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (EAT)', region: 'Africa' },
  { value: 'Africa/Kampala', label: 'Kampala (EAT)', region: 'Africa' },
  { value: 'Africa/Accra', label: 'Accra (GMT)', region: 'Africa' },
  { value: 'Africa/Harare', label: 'Harare (CAT)', region: 'Africa' },
  { value: 'Africa/Maputo', label: 'Maputo (CAT)', region: 'Africa' },
  { value: 'Africa/Luanda', label: 'Luanda (WAT)', region: 'Africa' },
  { value: 'Africa/Douala', label: 'Douala (WAT)', region: 'Africa' },
  { value: 'Africa/Abidjan', label: 'Abidjan (GMT)', region: 'Africa' },
  { value: 'Africa/Dakar', label: 'Dakar (GMT)', region: 'Africa' },
  { value: 'Africa/Mogadishu', label: 'Mogadishu (EAT)', region: 'Africa' },
  { value: 'Africa/Mauritius', label: 'Mauritius (MUT)', region: 'Africa' },
  { value: 'Africa/Port_Louis', label: 'Port Louis (MUT)', region: 'Africa' },
  { value: 'Africa/Nouakchott', label: 'Nouakchott (GMT)', region: 'Africa' },
  { value: 'Africa/Bamako', label: 'Bamako (GMT)', region: 'Africa' },
  { value: 'Africa/Ouagadougou', label: 'Ouagadougou (GMT)', region: 'Africa' },
  { value: 'Africa/Brazzaville', label: 'Brazzaville (WAT)', region: 'Africa' },
  { value: 'Africa/Kinshasa', label: 'Kinshasa (WAT)', region: 'Africa' },
  { value: 'Africa/Libreville', label: 'Libreville (WAT)', region: 'Africa' },
  { value: 'Africa/Malabo', label: 'Malabo (WAT)', region: 'Africa' },
  { value: 'Africa/Tunis', label: 'Tunis (CET)', region: 'Africa' },
  { value: 'Africa/Algiers', label: 'Algiers (CET)', region: 'Africa' },

  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', region: 'Oceania' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)', region: 'Oceania' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)', region: 'Oceania' },
  { value: 'Australia/Perth', label: 'Perth (AWST)', region: 'Oceania' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)', region: 'Oceania' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST)', region: 'Oceania' },
  { value: 'Australia/Hobart', label: 'Hobart (AEST/AEDT)', region: 'Oceania' },
  { value: 'Australia/Canberra', label: 'Canberra (AEST/AEDT)', region: 'Oceania' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', region: 'Oceania' },
  { value: 'Pacific/Wellington', label: 'Wellington (NZST/NZDT)', region: 'Oceania' },
  { value: 'Pacific/Fiji', label: 'Fiji (FJT)', region: 'Oceania' },
  { value: 'Pacific/Guam', label: 'Guam (ChST)', region: 'Oceania' },
  { value: 'Pacific/Suva', label: 'Suva (FJT)', region: 'Oceania' },
  { value: 'Pacific/Apia', label: 'Apia (WSDT/WSDT)', region: 'Oceania' },
  { value: 'Pacific/Tongatapu', label: 'Tongatapu (TOT)', region: 'Oceania' },
  { value: 'Pacific/Pago_Pago', label: 'Pago Pago (SST)', region: 'Oceania' },
  { value: 'Pacific/Honolulu', label: 'Honolulu (HST)', region: 'Oceania' },

  // Additional Pacific
  { value: 'Pacific/Guadalcanal', label: 'Guadalcanal (SBT)', region: 'Pacific Islands' },
  { value: 'Pacific/Port_Moresby', label: 'Port Moresby (PGT)', region: 'Pacific Islands' },
  { value: 'Pacific/Noumea', label: 'Nouméa (NCT)', region: 'Pacific Islands' },
  { value: 'Pacific/Tahiti', label: 'Tahiti (TAHT)', region: 'Pacific Islands' },
  { value: 'Pacific/Rarotonga', label: 'Rarotonga (CKT)', region: 'Pacific Islands' },
  { value: 'Pacific/Majuro', label: 'Majuro (MHT)', region: 'Pacific Islands' },
  { value: 'Pacific/Tarawa', label: 'Tarawa (GILT)', region: 'Pacific Islands' },
  { value: 'Pacific/Funafuti', label: 'Funafuti (TVT)', region: 'Pacific Islands' },
  { value: 'Pacific/Wake', label: 'Wake Island (WAKT)', region: 'Pacific Islands' },
  { value: 'Pacific/Wallis', label: 'Wallis (WFT)', region: 'Pacific Islands' },
  { value: 'Pacific/Ponape', label: 'Ponape (PONT)', region: 'Pacific Islands' },
  { value: 'Pacific/Kosrae', label: 'Kosrae (KOST)', region: 'Pacific Islands' },
  { value: 'Pacific/Pitcairn', label: 'Pitcairn (PST)', region: 'Pacific Islands' },
  { value: 'Pacific/Easter', label: 'Easter Island (EAST)', region: 'Pacific Islands' },
  { value: 'Pacific/Galapagos', label: 'Galapagos (GALT)', region: 'Pacific Islands' },
  { value: 'Pacific/Midway', label: 'Midway (SST)', region: 'Pacific Islands' },
  { value: 'Pacific/Kwajalein', label: 'Kwajalein (MHT)', region: 'Pacific Islands' },
  { value: 'Pacific/Chatham', label: 'Chatham (CHAST)', region: 'Pacific Islands' },
  { value: 'Pacific/Norfolk', label: 'Norfolk (NFT)', region: 'Pacific Islands' },
  { value: 'Pacific/Efate', label: 'Efate (VUT)', region: 'Pacific Islands' },
  { value: 'Pacific/Enderbury', label: 'Enderbury (PHOT)', region: 'Pacific Islands' },
  { value: 'Pacific/Kiritimati', label: 'Kiritimati (LINT)', region: 'Pacific Islands' },
  { value: 'Indian/Mauritius', label: 'Mauritius (MUT)', region: 'Indian Ocean' },
  { value: 'Indian/Reunion', label: 'Réunion (RET)', region: 'Indian Ocean' },
  { value: 'Indian/Maldives', label: 'Maldives (MVT)', region: 'Indian Ocean' },
  { value: 'Indian/Kerguelen', label: 'Kerguelen (TFT)', region: 'Indian Ocean' },
  { value: 'Indian/Mahe', label: 'Mahé (SCT)', region: 'Indian Ocean' },
  { value: 'Indian/Chagos', label: 'Chagos (IOT)', region: 'Indian Ocean' },
  { value: 'Indian/Christmas', label: 'Christmas (CXT)', region: 'Indian Ocean' },
  { value: 'Indian/Cocos', label: 'Cocos (CCT)', region: 'Indian Ocean' },
] as const

const profileFormSchema = z.object({
  company_name: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  currency: z.string().optional(),
  date_format: z.string().optional(),
  timezone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

type SettingsResponse = {
  id: number
  company_name: string | null
  company_logo: string | null
  address1?: string | null
  address2?: string | null
  currency?: string | null
  date_format?: string | null
  timezone?: string | null
}

export function ProfileForm() {
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [openCurrency, setOpenCurrency] = useState(false)
  const [openTimezone, setOpenTimezone] = useState(false)
  const [timezoneSearch, setTimezoneSearch] = useState('')
  const [currentTime, setCurrentTime] = useState<string>('')
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  // Filter timezones based on search
  const filteredTimezones = timezoneSearch
    ? TIMEZONES.filter(tz =>
        tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
        tz.region.toLowerCase().includes(timezoneSearch.toLowerCase())
      )
    : TIMEZONES

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      company_name: '',
      address1: '',
      address2: '',
      currency: 'BDT',
      date_format: 'MM/DD/YYYY',
      timezone: 'Asia/Dhaka',
    },
    mode: 'onChange',
  })

  const { data: settingsData, isLoading } = useQuery<SettingsResponse>({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await api.get('/company-settings')
      return res.data.data
    },
  })

  useEffect(() => {
    if (settingsData) {
      form.reset({
        company_name: settingsData.company_name || '',
        address1: settingsData.address1 || '',
        address2: settingsData.address2 || '',
        currency: settingsData.currency || 'BDT',
        date_format: settingsData.date_format || 'MM/DD/YYYY',
        timezone: settingsData.timezone || 'Asia/Dhaka',
      })

      if (settingsData.currency) {
        dispatch(setCurrency(settingsData.currency))
      }

      let logo = settingsData.company_logo || ''
      if (logo && !logo.startsWith('http') && !logo.startsWith('data:')) {
        logo = `${import.meta.env.VITE_API_URL}${logo}`
      }
      setCurrentLogo(logo)
      setLogoUrl(logo)
    }
  }, [settingsData, form])

  // Get current timezone from form or default to Asia/Dhaka
  const currentTimezone = form.watch('timezone') || 'Asia/Dhaka'

  // Update clock every second based on selected timezone
  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date()
        const options = {
          timeZone: currentTimezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }
        const formatter = new Intl.DateTimeFormat('en-US', options)
        setCurrentTime(formatter.format(now))
      } catch (error) {
        console.error('Error updating clock:', error)
        setCurrentTime('Invalid Timezone')
      }
    }

    // Update immediately and then every second
    updateClock()
    const interval = setInterval(updateClock, 1000)

    return () => clearInterval(interval)
  }, [currentTimezone])

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormValues & { company_logo?: string }) => {
      const res = await api.put('/company-settings', {
        company_name: data.company_name || '',
        address1: data.address1 || '',
        address2: data.address2 || '',
        currency: data.currency || 'BDT',
        date_format: data.date_format || 'MM/DD/YYYY',
        timezone: data.timezone || 'Asia/Dhaka',
        company_logo: data.company_logo || '',
      })
      return res.data
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Company settings updated')
      if (response.data?.currency) dispatch(setCurrency(response.data.currency))
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update')
    },
  })

  const handleSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate({ ...data, company_logo: logoUrl })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        {/* Company Identity Card */}
        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Company Identity</CardTitle>
                <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                  Company logo and name for branding
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {currentLogo && (
                <div>
                  <div className="text-sm font-semibold mb-2">Current Logo</div>
                  <div className="flex justify-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <img
                      src={currentLogo}
                      alt="Company Logo"
                      className="h-20 max-w-xs object-contain"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-semibold mb-2">Select Logo from Gallery</div>
                <div className="flex justify-center">
                  <GallerySelector
                    onImageSelect={(url) => { setLogoUrl(url); setCurrentLogo(url); }}
                    currentImage={logoUrl}
                    triggerLabel="Choose Logo from Gallery"
                    triggerClassName="gap-2"
                    accept="image/png,image/jpeg,image/svg+xml"
                    maxSize={2 * 1024 * 1024}
                    aspectRatio="landscape"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Choose a logo from the uploaded gallery images
                </p>
              </div>

              <FormField
                control={form.control}
                name='company_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Company Name' {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Details Card */}
        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Company Details</CardTitle>
                <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                  Address, currency, and date format settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name='address1'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder='Street address, area, locality' {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='address2'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Address Line 2</FormLabel>
                    <FormControl>
                      <Input placeholder='City, state, postal code' {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='currency'
                render={({ field }) => {
                  const selected = field.value ? getCurrencyByCode(field.value) : undefined
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Currency</FormLabel>
                      <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" aria-expanded={openCurrency} className="w-full justify-between font-normal text-sm">
                              {selected ? `${selected.code} — ${selected.name}` : 'Select currency'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search country or currency..." className="text-sm" />
                            <CommandList>
                              <CommandEmpty>No currency found.</CommandEmpty>
                              <CommandGroup>
                                {CURRENCIES.map((c) => (
                                  <CommandItem
                                    key={`${c.country}-${c.code}`}
                                    value={`${c.country} ${c.code} ${c.name}`.toLowerCase()}
                                    onSelect={() => {
                                      field.onChange(c.code)
                                      setOpenCurrency(false)
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${field.value === c.code ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    <span className="flex-1 text-sm">{c.country} — {c.name}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{c.code}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-xs">
                        Select your default currency. This is used across invoices and reports.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name='date_format'
                render={({ field }) => {
                  const selected = DATE_FORMATS.find((f) => f.value === field.value)
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Date Format</FormLabel>
                      <Select
                        key={field.value}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DATE_FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value} className="text-sm">
                              {f.label} — {f.sample}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Choose how dates are displayed across the app.
                        {selected ? ` Example: ${selected.sample}` : ''}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name='timezone'
                render={({ field }) => {
                  const selected = TIMEZONES.find((t) => t.value === field.value)
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Timezone</FormLabel>
                      <Popover open={openTimezone} onOpenChange={setOpenTimezone}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className="w-full justify-between font-normal text-sm">
                              {selected ? `${selected.label}` : 'Select timezone'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search timezone or region..."
                              className="text-sm"
                              value={timezoneSearch}
                              onValueChange={setTimezoneSearch}
                            />
                            <CommandList className="max-h-[400px]">
                              <CommandEmpty>No timezone found.</CommandEmpty>
                              <CommandGroup heading="Global">
                                {filteredTimezones.filter(tz => tz.region === 'Global').map((tz) => (
                                  <CommandItem
                                    key={tz.value}
                                    value={tz.value}
                                    onSelect={() => {
                                      field.onChange(tz.value)
                                      setOpenTimezone(false)
                                      setTimezoneSearch('')
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${field.value === tz.value ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      <Globe className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">{tz.label}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              {['North America', 'South America', 'Europe', 'Middle East', 'Asia', 'Central Asia', 'Africa', 'Oceania', 'Pacific Islands', 'Indian Ocean'].map(region => (
                                <CommandGroup key={region} heading={region}>
                                  {filteredTimezones.filter(tz => tz.region === region).slice(0, 20).map((tz) => (
                                    <CommandItem
                                      key={tz.value}
                                      value={tz.value}
                                      onSelect={() => {
                                        field.onChange(tz.value)
                                        setOpenTimezone(false)
                                        setTimezoneSearch('')
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${field.value === tz.value ? 'opacity-100' : 'opacity-0'}`}
                                      />
                                      <div className="flex items-center gap-2 flex-1">
                                        <Globe className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">{tz.label}</span>
                                        <span className="text-xs text-muted-foreground">({tz.region})</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-xs">
                        Search by city name or region. {filteredTimezones.length}+ timezones available.
                        {selected ? ` Currently: ${selected.label}` : ''}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            {/* Live Clock */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-800">Current Time</h4>
                    <span className="text-xs text-muted-foreground">({form.watch('timezone') || 'Asia/Dhaka'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">
                      {currentTime || 'Loading...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pb-10">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[150px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Update Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
