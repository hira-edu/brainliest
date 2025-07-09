import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Search, Settings, Image as ImageIcon, Save, X } from 'lucide-react';
import { useToast } from '../../shared/hooks/use-toast';
import { apiRequest, queryClient } from '../../../services/queryClient';

interface Subject {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Exam {
  slug: string;
  subjectSlug: string;
  title: string;
  description: string;
  icon?: string;
}

interface Category {
  slug: string;
  name: string;
  description: string;
  icon?: string;
}

interface Subcategory {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  icon?: string;
}

interface Upload {
  id: number;
  fileName: string;
  originalName: string;
  uploadPath: string;
  fileType: string;
  mimeType: string;
  isActive: boolean;
}

const IconAssignment: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('subjects');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['admin-subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects');
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    }
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ['admin-exams'],
    queryFn: async () => {
      const response = await fetch('/api/exams');
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    }
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: subcategories } = useQuery<Subcategory[]>({
    queryKey: ['admin-subcategories'],
    queryFn: async () => {
      const response = await fetch('/api/subcategories');
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      return response.json();
    }
  });

  const { data: uploads } = useQuery<Upload[]>({
    queryKey: ['admin-uploads-for-icons'],
    queryFn: async () => {
      const response = await fetch('/api/admin/uploads?fileType=image&limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch uploads');
      const data = await response.json();
      return data.uploads?.filter((upload: Upload) => upload.isActive) || [];
    }
  });

  // Icon assignment mutation
  const assignIconMutation = useMutation({
    mutationFn: async ({ entityType, slug, icon }: { entityType: string; slug: string; icon: string }) => {
      const response = await fetch(`/api/admin/${entityType}/${slug}/icon`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ icon })
      });
      if (!response.ok) throw new Error('Failed to assign icon');
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Icon assigned",
        description: `Icon has been assigned to ${variables.entityType.slice(0, -1)} successfully.`
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`admin-${variables.entityType}`] });
      queryClient.invalidateQueries({ queryKey: [variables.entityType] });
      setSelectedEntity(null);
      setSelectedEntityType('');
    },
    onError: (error: any) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign icon",
        variant: "destructive"
      });
    }
  });

  const handleAssignIcon = (iconPath: string) => {
    if (selectedEntity && selectedEntityType) {
      assignIconMutation.mutate({
        entityType: selectedEntityType,
        slug: selectedEntity.slug,
        icon: iconPath
      });
    }
  };

  const filterEntities = (entities: any[], searchTerm: string) => {
    if (!searchTerm) return entities || [];
    return entities?.filter(entity => 
      entity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.title?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  };

  const EntityCard: React.FC<{ entity: any; type: string; onAssign: () => void }> = ({ entity, type, onAssign }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {entity.icon && (
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {entity.icon.startsWith('/uploads/') ? (
                <img src={entity.icon} alt="Icon" className="w-8 h-8 object-contain" />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}
          <div>
            <h3 className="font-medium">{entity.name || entity.title}</h3>
            <p className="text-sm text-gray-500">{entity.description}</p>
            {entity.icon && (
              <Badge variant="outline" className="mt-1">
                {entity.icon.startsWith('/uploads/') ? 'Custom Icon' : 'Default Icon'}
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAssign}
          className="flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Assign Icon</span>
        </Button>
      </div>
    </Card>
  );

  const IconGrid: React.FC = () => (
    <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto">
      {uploads?.map((upload) => (
        <div
          key={upload.id}
          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => handleAssignIcon(upload.uploadPath)}
        >
          <div className="flex flex-col items-center space-y-2">
            <img
              src={upload.uploadPath}
              alt={upload.originalName}
              className="w-16 h-16 object-contain"
            />
            <span className="text-xs text-center truncate w-full">
              {upload.originalName}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Icon Assignment</h2>
          <p className="text-gray-600">Assign custom icons to subjects, exams, categories, and subcategories</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="subjects" className="space-y-4">
          <div className="grid gap-4">
            {filterEntities(subjects, searchTerm).map((subject) => (
              <EntityCard
                key={subject.slug}
                entity={subject}
                type="subjects"
                onAssign={() => {
                  setSelectedEntity(subject);
                  setSelectedEntityType('subjects');
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <div className="grid gap-4">
            {filterEntities(exams, searchTerm).map((exam) => (
              <EntityCard
                key={exam.slug}
                entity={exam}
                type="exams"
                onAssign={() => {
                  setSelectedEntity(exam);
                  setSelectedEntityType('exams');
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4">
            {filterEntities(categories, searchTerm).map((category) => (
              <EntityCard
                key={category.slug}
                entity={category}
                type="categories"
                onAssign={() => {
                  setSelectedEntity(category);
                  setSelectedEntityType('categories');
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subcategories" className="space-y-4">
          <div className="grid gap-4">
            {filterEntities(subcategories, searchTerm).map((subcategory) => (
              <EntityCard
                key={subcategory.slug}
                entity={subcategory}
                type="subcategories"
                onAssign={() => {
                  setSelectedEntity(subcategory);
                  setSelectedEntityType('subcategories');
                }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Icon Assignment Dialog */}
      <Dialog open={!!selectedEntity} onOpenChange={() => setSelectedEntity(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Assign Icon to {selectedEntity?.name || selectedEntity?.title}
            </DialogTitle>
            <DialogDescription>
              Select an icon from uploaded files to assign to this {selectedEntityType?.slice(0, -1)}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                {selectedEntity?.icon && selectedEntity.icon.startsWith('/uploads/') ? (
                  <img src={selectedEntity.icon} alt="Current icon" className="w-12 h-12 object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{selectedEntity?.name || selectedEntity?.title}</h3>
                <p className="text-sm text-gray-500">
                  {selectedEntity?.icon ? 'Current icon assigned' : 'No icon assigned'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Select New Icon</h4>
              {uploads && uploads.length > 0 ? (
                <IconGrid />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No uploaded images available</p>
                  <p className="text-sm">Upload images first to assign as icons</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedEntity(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              {selectedEntity?.icon && (
                <Button
                  variant="outline"
                  onClick={() => handleAssignIcon('')}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove Icon
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IconAssignment;