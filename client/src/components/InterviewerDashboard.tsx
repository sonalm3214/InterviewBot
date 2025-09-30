import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Star, 
  Search, 
  Download, 
  Eye,
  Play,
  Bell,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Candidate, InterviewStats } from '@shared/schema';
import CandidateDetailModal from './CandidateDetailModal';

export default function InterviewerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch interview stats
  const { data: stats } = useQuery<InterviewStats>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch candidates
  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ['/api/candidates'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Filter candidates based on search and status
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    const configs = {
      completed: { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle },
      interviewing: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      info_collection: { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800', icon: Clock },
      paused: { variant: 'outline' as const, color: 'bg-red-100 text-red-800', icon: Clock },
      pending: { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800', icon: Clock },
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'info_collection' ? 'Collecting Info' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getProgressPercentage = (status: string, currentQuestionIndex: number | null = 0) => {
    if (status === 'completed') return 100;
    return Math.round(((currentQuestionIndex || 0) / 6) * 100);
  };

  const renderStars = (score?: number) => {
    if (!score) return null;
    
    const fullStars = Math.floor(score / 2);
    const hasHalfStar = (score % 2) >= 1;
    
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i}
            className={`w-3 h-3 ${
              i < fullStars 
                ? 'text-yellow-400 fill-yellow-400' 
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="container mx-auto px-4 py-6" data-testid="interviewer-dashboard">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Interviewer Dashboard</h2>
          <p className="text-muted-foreground">Monitor and review candidate interviews</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span data-testid="text-active-interviews">
              {stats?.activeInterviews || 0} Active Interviews
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-candidates">
                  {stats?.totalCandidates || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-completed">
                  {stats?.completedInterviews || 0}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-in-progress">
                  {stats?.activeInterviews || 0}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-average-score">
                  {stats?.averageScore || 0}
                </p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Table */}
      <Card>
        {/* Table Header */}
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle>Candidates</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="interviewing">In Progress</SelectItem>
                  <SelectItem value="info_collection">Collecting Info</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading candidates...</p>
              </div>
            </div>
          ) : paginatedCandidates.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No candidates found</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-accent/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Candidate</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Score</th>
                  <th className="text-left p-4 font-semibold">Progress</th>
                  <th className="text-left p-4 font-semibold">Started</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCandidates.map((candidate) => (
                  <tr 
                    key={candidate.id}
                    className="border-b border-border hover:bg-accent/30 cursor-pointer"
                    onClick={() => setSelectedCandidate(candidate)}
                    data-testid={`row-candidate-${candidate.id}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(candidate.name)}`}>
                          {getAvatarInitials(candidate.name)}
                        </div>
                        <div>
                          <p className="font-medium" data-testid="text-candidate-name">{candidate.name}</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-candidate-email">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(candidate.status)}
                    </td>
                    <td className="p-4">
                      {candidate.score ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" data-testid="text-candidate-score">{candidate.score}/10</span>
                          {renderStars(candidate.score)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              candidate.status === 'completed' ? 'bg-green-500' :
                              candidate.status === 'interviewing' ? 'bg-yellow-500' :
                              candidate.status === 'paused' ? 'bg-red-500' :
                              'bg-gray-300'
                            }`}
                            style={{ width: `${getProgressPercentage(candidate.status, candidate.currentQuestionIndex)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground" data-testid="text-questions-progress">
                          {candidate.currentQuestionIndex || 0}/6
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm" data-testid="text-started-at">
                        {candidate.startedAt ? new Date(candidate.startedAt).toLocaleString() : 'Not started'}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(candidate);
                          }}
                          data-testid="button-view-details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {candidate.status === 'interviewing' && (
                          <Button variant="ghost" size="sm" data-testid="button-view-live">
                            <MessageCircle className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        
                        {candidate.status === 'paused' && (
                          <Button variant="ghost" size="sm" data-testid="button-resume">
                            <Play className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        
                        {candidate.status === 'completed' && (
                          <Button variant="ghost" size="sm" data-testid="button-download">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {['info_collection', 'paused'].includes(candidate.status) && (
                          <Button variant="ghost" size="sm" data-testid="button-send-reminder">
                            <Bell className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length} candidates
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}
