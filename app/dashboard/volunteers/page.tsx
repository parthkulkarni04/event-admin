"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { 
  ArrowLeft, ArrowUpDown, CalendarDays, Eye, Search, 
  Trash2, Building2, Phone, Mail, MapPin, Calendar 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import type { VolunteerNonAuth } from "@/lib/supabase"

export default function VolunteersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [volunteers, setVolunteers] = useState<VolunteerNonAuth[]>([])
  const [filteredVolunteers, setFilteredVolunteers] = useState<VolunteerNonAuth[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalVolunteers, setTotalVolunteers] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [volunteerToDelete, setVolunteerToDelete] = useState<VolunteerNonAuth | null>(null)
  const [filterOrganization, setFilterOrganization] = useState<string>("all")
  
  const volunteersPerPage = 10
  const totalPages = Math.ceil(filteredVolunteers.length / volunteersPerPage)
  
  // Fetch the list of organizations for filtering
  const [organizations, setOrganizations] = useState<string[]>([])

  useEffect(() => {
    fetchVolunteers()
  }, [])
  
  // Apply filters whenever search or filters change
  useEffect(() => {
    filterVolunteers()
  }, [searchQuery, volunteers, filterOrganization])
  
  // Get unique organizations from volunteers
  useEffect(() => {
    if (volunteers.length > 0) {
      const uniqueOrgs = Array.from(
        new Set(
          volunteers
            .map(v => v.organization)
            .filter(org => org !== null && org !== "") as string[]
        )
      ).sort()
      setOrganizations(uniqueOrgs)
    }
  }, [volunteers])

  async function fetchVolunteers() {
    setIsLoading(true)
    try {
      const { data, error, count } = await supabase
        .from("volunteers_non_auth")
        .select("*", { count: "exact" })
        .order(sortField, { ascending: sortOrder === "asc" })
      
      if (error) throw error
      
      setVolunteers(data || [])
      setTotalVolunteers(count || 0)
    } catch (error) {
      console.error("Error fetching volunteers:", error)
      toast({
        title: "Error",
        description: "Failed to load volunteers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  function filterVolunteers() {
    let filtered = [...volunteers]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        volunteer =>
          volunteer.full_name?.toLowerCase().includes(query) ||
          volunteer.email?.toLowerCase().includes(query) ||
          volunteer.organization?.toLowerCase().includes(query) ||
          volunteer.preferred_location?.toLowerCase().includes(query)
      )
    }
    
    // Apply organization filter
    if (filterOrganization !== "all") {
      filtered = filtered.filter(
        volunteer => volunteer.organization === filterOrganization
      )
    }
    
    setFilteredVolunteers(filtered)
    
    // Reset to first page when filters change
    setCurrentPage(1)
  }
  
  function handleSort(field: string) {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Default to descending for new sort field
      setSortField(field)
      setSortOrder("desc")
    }
    
    // Re-sort the data
    const sorted = [...volunteers].sort((a, b) => {
      const valueA = a[field as keyof VolunteerNonAuth]
      const valueB = b[field as keyof VolunteerNonAuth]
      
      // Handle null values
      if (valueA === null) return sortOrder === "asc" ? -1 : 1
      if (valueB === null) return sortOrder === "asc" ? 1 : -1
      
      // Compare strings
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA)
      }
      
      // Compare dates
      if (field === "created_at" || field.includes("date")) {
        const dateA = valueA ? new Date(valueA as string).getTime() : 0
        const dateB = valueB ? new Date(valueB as string).getTime() : 0
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      }
      
      // Compare other values
      return sortOrder === "asc"
        ? (valueA as any) > (valueB as any) ? 1 : -1
        : (valueB as any) > (valueA as any) ? 1 : -1
    })
    
    setVolunteers(sorted)
  }
  
  async function deleteVolunteer() {
    if (!volunteerToDelete) return
    
    try {
      const { error } = await supabase
        .from("volunteers_non_auth")
        .delete()
        .eq("id", volunteerToDelete.id)
      
      if (error) throw error
      
      // Remove from the state
      setVolunteers(volunteers.filter(v => v.id !== volunteerToDelete.id))
      
      toast({
        title: "Volunteer deleted",
        description: "The volunteer has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting volunteer:", error)
      toast({
        title: "Error",
        description: "Failed to delete volunteer",
        variant: "destructive",
      })
    } finally {
      setVolunteerToDelete(null)
      setDeleteDialogOpen(false)
    }
  }
  
  // Get paginated volunteer data
  const paginatedVolunteers = filteredVolunteers.slice(
    (currentPage - 1) * volunteersPerPage,
    currentPage * volunteersPerPage
  )
  
  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include the first page
      pageNumbers.push(1)
      
      // Calculate start and end of page numbers to show
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, maxPagesToShow - 1)
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - (maxPagesToShow - 2))
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pageNumbers.push("...")
      }
      
      // Add page numbers
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pageNumbers.push("...")
      }
      
      // Always include the last page
      pageNumbers.push(totalPages)
    }
    
    return pageNumbers
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Volunteers</h1>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full gap-2 md:w-2/3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select 
              value={filterOrganization} 
              onValueChange={setFilterOrganization}
            >
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org} value={org}>{org}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <>
                Showing {filteredVolunteers.length} of {totalVolunteers} volunteers
              </>
            )}
          </div>
        </div>

        {/* Volunteers Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("full_name")}
                    className="hover:bg-transparent px-0 font-medium"
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("organization")}
                    className="hover:bg-transparent px-0 font-medium"
                  >
                    Organization
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("preferred_location")}
                    className="hover:bg-transparent px-0 font-medium"
                  >
                    Location
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("created_at")}
                    className="hover:bg-transparent px-0 font-medium"
                  >
                    Joined
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedVolunteers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {searchQuery || filterOrganization !== "all" ? (
                      <div className="text-center">
                        <p>No volunteers found matching your search criteria.</p>
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setSearchQuery("")
                            setFilterOrganization("all")
                          }}
                        >
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      "No volunteers found."
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell className="font-medium">
                      {volunteer.full_name || "Unnamed Volunteer"}
                    </TableCell>
                    <TableCell>
                      {volunteer.organization ? (
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          {volunteer.organization}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {volunteer.email && (
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{volunteer.email}</span>
                          </div>
                        )}
                        {volunteer.mobile_number && (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{volunteer.mobile_number}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {volunteer.preferred_location ? (
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          {volunteer.preferred_location}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {volunteer.created_at ? (
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(new Date(volunteer.created_at), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/volunteers/${volunteer.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => {
                            setVolunteerToDelete(volunteer)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {filteredVolunteers.length > 0 && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "..." ? (
                    <span className="px-2">...</span>
                  ) : (
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Volunteer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this volunteer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-4">
            <div className="font-medium">{volunteerToDelete?.full_name || "Unnamed Volunteer"}</div>
            {volunteerToDelete?.email && <div className="text-sm">{volunteerToDelete.email}</div>}
            {volunteerToDelete?.organization && (
              <div className="text-sm text-muted-foreground">{volunteerToDelete.organization}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteVolunteer}
            >
              Delete Volunteer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

