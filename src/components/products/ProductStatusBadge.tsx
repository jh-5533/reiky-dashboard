import { Badge } from '@/components/ui/badge'

interface Props {
  status: 'draft' | 'published' | 'secret'
}

export function ProductStatusBadge({ status }: Props) {
  if (status === 'published') {
    return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Published</Badge>
  }
  if (status === 'secret') {
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Secret</Badge>
  }
  return <Badge variant="secondary">Draft</Badge>
}
