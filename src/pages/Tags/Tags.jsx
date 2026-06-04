import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import useNoteStore from "../../store/noteStore.js";
import usePasswordStore from "../../store/passwordStore.js";
import useFileStore from "../../store/fileStore.js";
import { isSmallScreen } from "../../utils/helpers.js";
import styles from "./Tags.module.css";

export default function TagsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  const notes = useNoteStore(s => s.notes);
  const passwords = usePasswordStore(s => s.passwords);
  const files = useFileStore(s => s.files);

  const fetchNotes = useNoteStore(s => s.fetch);
  const fetchPasswords = usePasswordStore(s => s.fetch);
  const fetchFiles = useFileStore(s => s.fetch);

  useEffect(() => {
    fetchNotes();
    fetchPasswords();
    fetchFiles();
  }, [fetchNotes, fetchPasswords, fetchFiles]);

  // Collect all unique tags
  const allTags = new Map();
  [...notes, ...passwords, ...files].forEach(item => {
    if (item.tags?.length) {
      item.tags.forEach(tag => {
        allTags.set(tag, (allTags.get(tag) || 0) + 1);
      });
    }
  });

  const sortedTags = Array.from(allTags.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  const itemsWithTag = selectedTag
    ? [
        ...notes.filter(n => n.tags?.includes(selectedTag)),
        ...passwords.filter(p => p.tags?.includes(selectedTag)),
        ...files.filter(f => f.tags?.includes(selectedTag)),
      ]
    : [];

  return (
    <div className={styles.wrapper}>
      {isSmallScreen() && <Navbar onMenuToggle={() => {}} />}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />

      <div className={styles.main}>
        <Header title="Tags" />

        <ContentArea>
          <div className={styles.container}>
            {sortedTags.length === 0 ? (
              <Card padding="lg" className={styles.emptyCard}>
                <div className={styles.emptyContent}>
                  <TagIcon />
                  <p className={styles.emptyText}>No tags yet</p>
                  <p className={styles.emptyHint}>Create tags by organizing notes, passwords, and files</p>
                </div>
              </Card>
            ) : (
              <div className={styles.split}>
                {/* Tags cloud */}
                <div className={styles.tagsSection}>
                  <h3 className={styles.sectionTitle}>All Tags ({sortedTags.length})</h3>
                  <div className={styles.tagCloud}>
                    {sortedTags.map(({ tag, count }) => (
                      <button
                        key={tag}
                        className={`${styles.tagButton} ${selectedTag === tag ? styles.active : ""}`}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      >
                        <span className={styles.tagName}>{tag}</span>
                        <span className={styles.tagCount}>{count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tagged items */}
                {selectedTag && (
                  <div className={styles.itemsSection}>
                    <h3 className={styles.sectionTitle}>Items tagged "{selectedTag}"</h3>
                    {itemsWithTag.length === 0 ? (
                      <p className={styles.noItems}>No items with this tag</p>
                    ) : (
                      <div className={styles.itemsList}>
                        {itemsWithTag.map((item, idx) => (
                          <Card key={idx} padding="md" hoverable>
                            <div className={styles.itemRow}>
                              <div>
                                <p className={styles.itemName}>{item.name || item.title}</p>
                                <p className={styles.itemType}>
                                  {item.content ? "Note" : item.password ? "Password" : "File"}
                                </p>
                              </div>
                              <span className={styles.itemIcon}>→</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ContentArea>
      </div>
    </div>
  );
}

function TagIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>; }
