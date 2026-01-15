'use client';

import React from 'react';
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

// Note: In a production app, you might want to register a custom font like Poppins
// for branding consistency. For now, we use standard sans-serif.

Font.register({
  family: 'Poppins',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Regular.ttf',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Medium.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-SemiBold.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf',
      fontWeight: 700,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Italic.ttf',
      fontStyle: 'italic',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 100, // Increased to clear header on multi-page exports
    paddingBottom: 60,
    paddingHorizontal: 50, // Decreased margins
    backgroundColor: '#ffffff',
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#111827',
  },
  header: {
    position: 'absolute',
    top: 35,
    left: 50, // Matches page padding
    right: 50,
    borderBottom: '0.5 solid #E5E7EB',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    fixed: true,
  },
  logo: {
    width: 150,
  },
  dateText: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: 400,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '0.5 solid #E5E7EB',
    paddingTop: 15,
    fixed: true,
  },
  content: {
    flexDirection: 'column',
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 12,
    color: '#111827',
    textAlign: 'left',
  },
  heading1: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 15,
    marginTop: 10,
    color: '#000000',
  },
  heading2: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 10,
    marginTop: 15,
    color: '#1F2937',
  },
  heading3: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    marginTop: 12,
    color: '#374151',
  },
  heading4: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
    marginTop: 10,
    color: '#4B5563',
  },
  hr: {
    borderBottom: '0.5 solid #E5E7EB',
    marginVertical: 15,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
  },
  bullet: {
    width: 15,
    fontSize: 11,
  },
  listItemText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.6,
  },
  watermarkView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.08, // Subtle opacity
    zIndex: -1,
  },
  watermarkImage: {
    width: 300,
  },
  bold: {
    fontWeight: 700,
  },
  italic: {
    fontStyle: 'italic',
  },
});

interface PdfDocumentProps {
  content: string;
  logo?: string | null;
}

const renderContent = (content: string) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      elements.push(<View key={`empty-${index}`} style={{ height: 8 }} />);
      return;
    }

    // Horizontal Rule
    if (
      trimmedLine === '***' ||
      trimmedLine === '---' ||
      trimmedLine === '___'
    ) {
      elements.push(<View key={index} style={styles.hr} />);
      return;
    }

    // Heading 1
    if (trimmedLine.startsWith('# ')) {
      elements.push(
        <Text key={index} style={styles.heading1}>
          {parseInline(trimmedLine.replace('# ', ''))}
        </Text>
      );
      return;
    }

    // Heading 2
    if (trimmedLine.startsWith('## ')) {
      elements.push(
        <Text key={index} style={styles.heading2}>
          {parseInline(trimmedLine.replace('## ', ''))}
        </Text>
      );
      return;
    }

    // Heading 3
    if (trimmedLine.startsWith('### ')) {
      elements.push(
        <Text key={index} style={styles.heading3}>
          {parseInline(trimmedLine.replace('### ', ''))}
        </Text>
      );
      return;
    }

    // Heading 4
    if (trimmedLine.startsWith('#### ')) {
      elements.push(
        <Text key={index} style={styles.heading4}>
          {parseInline(trimmedLine.replace('#### ', ''))}
        </Text>
      );
      return;
    }

    // List Items
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      elements.push(
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listItemText}>
            {parseInline(trimmedLine.substring(2))}
          </Text>
        </View>
      );
      return;
    }

    // Special case for blocks that are entirely italicized but contain bold (like the disclaimer)
    // e.g. ***Disclaimer:** text*
    if (
      trimmedLine.startsWith('***') &&
      trimmedLine.endsWith('*') &&
      trimmedLine.length > 5
    ) {
      elements.push(
        <Text key={index} style={[styles.paragraph, styles.italic]}>
          {parseInline(trimmedLine.slice(1, -1))}
        </Text>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <Text key={index} style={styles.paragraph}>
        {parseInline(trimmedLine)}
      </Text>
    );
  });

  return elements;
};

/**
 * Basic recursive inline parser for bold (**) and italics (*)
 */
const parseInline = (text: string): React.ReactNode => {
  if (!text) return null;

  // Split by bold (**bold**) or italic (*italic*)
  // This handles simple cases; for complex nested markdown, a more robust parser would be needed.
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <Text key={i} style={styles.bold}>
          {parseInline(part.slice(2, -2))}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <Text key={i} style={styles.italic}>
          {parseInline(part.slice(1, -1))}
        </Text>
      );
    }
    return part;
  });
};

export const PdfDocument = ({ content, logo }: PdfDocumentProps) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const logoSrc = logo || '/logo-transparent.png';

  return (
    <Document title="Compliance Statement">
      <Page size="A4" style={styles.page}>
        {/* Watermark Logo */}
        <View style={styles.watermarkView} fixed>
          <Image src={logoSrc} style={styles.watermarkImage} />
        </View>

        {/* Header */}
        <View style={styles.header} fixed>
          <Image src={logoSrc} style={styles.logo} />
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>{renderContent(content)}</View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};
