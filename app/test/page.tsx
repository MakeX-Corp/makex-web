'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Connection {
  connectionUri: string;
}

export default function DatabaseTester() {
  const [connection, setConnection] = useState<Connection>({ 
    connectionUri: 'postgresql://postgres.aljrjyhwwmjqfkgnbeiz:NjrycvJDbS9VCzPw@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionUri: connection.connectionUri,
          query
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute query');
      }
      
      const data = await response.json();
      setQueryResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute query');
      setQueryResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Connection URI</label>
            <Input
              placeholder="postgresql://username:password@host:port/database"
              value={connection.connectionUri}
              onChange={(e) => setConnection({ ...connection, connectionUri: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Format: postgresql://username:password@host:port/database
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Query Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your SQL query here"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={executeQuery} disabled={isLoading}>
            {isLoading ? 'Executing...' : 'Execute Query'}
          </Button>
          {queryResults.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(queryResults[0]).map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryResults.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, i) => (
                      <TableCell key={i}>{String(value)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
