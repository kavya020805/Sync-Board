import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

// Fetch the user's GitHub token securely from the database
export const useGithubToken = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['github_token', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const { data, error } = await supabase
        .from('user_github_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .single()
        
      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch github token:', error)
      }
      
      return data?.access_token || null
    },
    enabled: !!user
  })
}

// Create a branch in a linked GitHub repo
export const useCreateBranch = () => {
  const { data: token } = useGithubToken()
  
  return useMutation({
    mutationFn: async ({ owner, repo, branchName, baseBranch = 'main' }) => {
      if (!token) throw new Error('GitHub account not connected')
      
      // 1. Get the SHA of the base branch
      const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      })
      
      if (!refResponse.ok) {
        throw new Error(`Failed to find base branch ${baseBranch}`)
      }
      
      const refData = await refResponse.json()
      const sha = refData.object.sha
      
      // 2. Create the new branch
      const createResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: sha
        })
      })
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.message || 'Failed to create branch')
      }
      
      return await createResponse.json()
    }
  })
}

// Create a Pull Request in a linked GitHub repo
export const useCreatePR = () => {
  const { data: token } = useGithubToken()
  
  return useMutation({
    mutationFn: async ({ owner, repo, title, body, head, base = 'main' }) => {
      if (!token) throw new Error('GitHub account not connected')
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body,
          head,
          base
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create Pull Request')
      }
      
      return await response.json()
    }
  })
}

// Create an issue in a linked GitHub repo
export const useCreateGithubIssue = () => {
  const { data: token } = useGithubToken()
  
  return useMutation({
    mutationFn: async ({ owner, repo, title, body }) => {
      if (!token) throw new Error('GitHub account not connected')
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create GitHub Issue')
      }
      
      return await response.json()
    }
  })
}

// Search for an open Pull Request for a specific branch
export const useSearchPR = () => {
  const { data: token } = useGithubToken()
  
  return useMutation({
    mutationFn: async ({ owner, repo, branch }) => {
      if (!token) throw new Error('GitHub account not connected')
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?head=${owner}:${branch}&state=open`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to search for Pull Request')
      }
      
      const prs = await response.json()
      return prs.length > 0 ? prs[0] : null
    }
  })
}

// Close a Pull Request
export const useClosePR = () => {
  const { data: token } = useGithubToken()
  
  return useMutation({
    mutationFn: async ({ owner, repo, pullNumber }) => {
      if (!token) throw new Error('GitHub account not connected')
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state: 'closed'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to close Pull Request')
      }
      
      return await response.json()
    }
  })
}

// Update an issue in a linked GitHub repo
export const useUpdateGithubIssue = () => {
  const { data: token } = useGithubToken()
  
  return useMutation({
    mutationFn: async ({ owner, repo, issueNumber, title, body }) => {
      if (!token) throw new Error('GitHub account not connected')
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update GitHub Issue')
      }
      
      return await response.json()
    }
  })
}

// Close an issue in a linked GitHub repo (used when deleting an issue in Sync-Board)
export const useCloseGithubIssue = () => {
  const { data: token } = useGithubToken()
  
  return useMutation({
    mutationFn: async ({ owner, repo, issueNumber }) => {
      if (!token) throw new Error('GitHub account not connected')
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state: 'closed'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to close GitHub Issue')
      }
      
      return await response.json()
    }
  })
}
