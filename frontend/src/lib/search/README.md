# Search normalization

`unaccent.json` is derived from PostgreSQL 17's standard `unaccent.rules`:
https://github.com/postgres/postgres/blob/REL_17_STABLE/contrib/unaccent/unaccent.rules

This keeps the local ingredient picker consistent with the API, including
ligatures and combining accents. The database integration tests compare the
whole mapping with the database's `search_unaccent` function. PostgreSQL 16
and 17 differ in fraction expansion: the SQL wrapper explicitly expands
fractions with a leading space (the PostgreSQL 17 convention) on both versions.
When upgrading
PostgreSQL or changing that dictionary, update the mapping and rebuild the
search indexes together. Do not customize the database dictionary separately.

PostgreSQL License

Copyright (c) 1996-2024, PostgreSQL Global Development Group

Copyright (c) 1994, The Regents of the University of California

Permission to use, copy, modify, and distribute this software and its
documentation for any purpose, without fee, and without a written agreement
is hereby granted, provided that the above copyright notice and this paragraph
and the following two paragraphs appear in all copies.

IN NO EVENT SHALL THE UNIVERSITY OF CALIFORNIA BE LIABLE TO ANY PARTY FOR
DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING
LOST PROFITS, ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION,
EVEN IF THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED OF THE POSSIBILITY OF
SUCH DAMAGE.

THE UNIVERSITY OF CALIFORNIA SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING,
BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE. THE SOFTWARE PROVIDED HEREUNDER IS ON AN "AS IS" BASIS,
AND THE UNIVERSITY OF CALIFORNIA HAS NO OBLIGATIONS TO PROVIDE MAINTENANCE,
SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.
