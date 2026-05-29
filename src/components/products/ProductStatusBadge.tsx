import { Badge } from '@/components/ui/badge'

interface Props {
  status: 'draft' | 'published' | 'secret'
}

export function ProductStatusBadge({ status }: Props) {
  if (status === 'published') {
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Published</Badge>
  }
  if (status === 'secret') {
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Secret</Badge>
  }
  return <Badge variant="secondary">Draft</Badge>
}
