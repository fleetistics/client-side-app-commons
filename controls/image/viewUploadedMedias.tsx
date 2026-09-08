import React, { useRef, useState } from "react";
import { FlatList, Image, Modal, ScrollView, StatusBar, TouchableOpacity, View, useWindowDimensions } from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { UploadedMediaDto } from "@/app.Commons/dataLayer/model/uploadedMediaDto";
import { Button } from "@/app.Commons/controls/button";
import { Text } from "@/app.Commons/controls/text";
import { ChevronLeft, ChevronRight, X } from "@/components/ui/icons";


export function ViewUploadedMedias(props: {
  height?: number,
  files: Array<UploadedMediaDto>,
  removeFile?: (idx: number) => void,
  removeItem?: (item: UploadedMediaDto) => void,
  selectedItem?: number
}) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  return (
    <View style={{
      height: props.height ?? 65, padding: 10
    }}>

      <FullScreenImageViewer
        visible={viewerVisible}
        images={props.files}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />

      <ScrollView horizontal>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {props.files.map((el, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openViewer(index)}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri: el.PreviewUrl ?? el.Url
                }}
                style={{ height: (props.height ?? 65) - 20, width: (props.height ?? 65) - 20 }}
              />
            </TouchableOpacity>
          ))}
        </View></ScrollView>
    </View>
  );
}

function FullScreenImageViewer(props: {
  visible: boolean,
  images: Array<UploadedMediaDto>,
  initialIndex: number,
  onClose: () => void,
}) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<UploadedMediaDto>>(null);
  const [currentIndex, setCurrentIndex] = useState(props.initialIndex);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  React.useEffect(() => {
    if (props.visible) {
      setCurrentIndex(props.initialIndex);
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: props.initialIndex, animated: false });
      });
    }
  }, [props.visible, props.initialIndex, screenWidth]);

  if (!props.visible) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < props.images.length - 1;

  const goToIndex = (index: number) => {
    if (index < 0 || index >= props.images.length) return;
    listRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  return (
    <Modal visible={props.visible} animationType="fade" onRequestClose={props.onClose} presentationStyle="overFullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
        <StatusBar barStyle="light-content" />
        <View style={{ position: 'absolute', top: (insets.top > 0 ? insets.top : 0) + 8, right: (insets.right > 0 ? insets.right : 0) + 8, zIndex: 10 }}>
          <Button variant="ghost" size="icon" onPress={props.onClose}>
            <X color="#fff" size={28} />
          </Button>
        </View>

        <FlatList
          ref={listRef}
          data={props.images}
          horizontal
          pagingEnabled
          keyExtractor={(_, index) => index.toString()}
          initialScrollIndex={props.initialIndex}
          getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({ offset: info.index * screenWidth, animated: false });
          }}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentIndex(nextIndex);
          }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ width: screenWidth, height: screenHeight, justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={{ uri: item.PreviewUrl ?? item.Url }}
                style={{ width: screenWidth, height: screenHeight * 0.8 }}
                resizeMode="contain"
              />
            </View>
          )}
        />

        {props.images.length > 1 && (
          <>
            <View style={{ position: 'absolute', top: '50%', left: 6, marginTop: -24, zIndex: 10 }}>
              <Button variant="ghost" size="icon" disabled={!hasPrev} onPress={() => goToIndex(currentIndex - 1)}>
                <ChevronLeft color={hasPrev ? '#fff' : '#555'} size={36} />
              </Button>
            </View>
            <View style={{ position: 'absolute', top: '50%', right: 6, marginTop: -24, zIndex: 10 }}>
              <Button variant="ghost" size="icon" onPress={() => hasNext ? goToIndex(currentIndex + 1) : props.onClose()}>
                {hasNext ? <ChevronRight color="#fff" size={36} /> : <X color="#fff" size={36} />}
              </Button>
            </View>
          </>
        )}
        {props.images.length > 1 && (
          <View style={{ position: 'absolute', bottom: 20, alignSelf: 'center', zIndex: 10 }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text className="text-white text-xs">{currentIndex + 1} / {props.images.length}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

